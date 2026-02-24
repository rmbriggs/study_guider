"""
Analysis service: correlates handout/note materials with past test questions
to identify which topics the professor consistently tests and how they convert
content into exam questions.
"""

import json
from sqlalchemy.orm import Session
from app.models.course import (
    CourseTest,
    CourseTestAnalysis,
    CourseAttachment,
    CourseAttachmentTest,
    Course,
    Professor,
    CourseAttachmentType,
)
from app.services.file_parser import extract_text_from_file, extract_text_from_bytes, _resolve_file_path
from app.services.text_sanitizer import sanitize_text_for_gemini

ANALYSIS_MODEL = "gemini-2.5-flash"
_MAX_CHARS_PER_FILE = 10_000


def _repair_json_strings(s: str) -> str:
    """Replace unescaped newlines inside double-quoted strings with \\n so JSON can parse."""
    parts = s.split('"')
    for i in range(1, len(parts), 2):
        # Odd-indexed parts are inside double-quoted strings
        parts[i] = parts[i].replace("\n", "\\n").replace("\r", "\\r")
    return '"'.join(parts)


def _parse_gemini_json(raw: str) -> dict:
    """
    Parse JSON from Gemini, repairing common issues: markdown fences,
    unescaped newlines in strings, truncated output (unterminated string).
    """
    s = raw.strip()
    # Strip markdown code block if present
    if s.startswith("```"):
        first = s.find("\n")
        if first != -1:
            s = s[first + 1 :]
        if s.endswith("```"):
            s = s[: s.rindex("```")].strip()

    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass

    # Try repairing unescaped newlines inside strings (Gemini often outputs these)
    s_repaired = _repair_json_strings(s)
    last_error = None
    try:
        return json.loads(s_repaired)
    except json.JSONDecodeError as e:
        last_error = e
    s = s_repaired

    # Repair: often the response is truncated mid-string (e.g. "summary" cut off)
    pos = getattr(last_error, "pos", len(s)) if last_error else len(s)
    if pos > len(s):
        pos = len(s)

    # Try closing an unterminated string and the root object
    for suffix in ('"}\n}', '"}', '}\n}'):
        try:
            return json.loads(s[:pos] + suffix)
        except json.JSONDecodeError:
            continue

    # Trim backward from error position: close string and object (salvage truncated output)
    for i in range(pos, max(0, pos - 1000), -1):
        tail = s[i:]
        # If we're clearly inside a string (no unescaped " in tail), close it and the object
        if '"' not in tail or tail.strip().startswith('"'):
            try:
                return json.loads(s[:i].rstrip().rstrip(",") + '"}\n}')
            except json.JSONDecodeError:
                pass
        try:
            return json.loads(s[:i] + '"}\n}')
        except json.JSONDecodeError:
            continue

    raise RuntimeError(f"Failed to parse Gemini JSON response: {last_error}")


def analyze_test_block(test_id: int, db: Session, api_key: str) -> CourseTestAnalysis:
    """
    Run LLM analysis correlating handouts/notes with a past test.
    Creates or replaces the CourseTestAnalysis record and updates the
    professor's aggregated analysis_profile.
    """
    test = db.query(CourseTest).filter(CourseTest.id == test_id).first()
    if not test:
        raise ValueError(f"Test block {test_id} not found")

    # Get all attachments linked to this test via the junction table
    link_rows = db.query(CourseAttachmentTest).filter(CourseAttachmentTest.test_id == test_id).all()
    att_ids = [r.attachment_id for r in link_rows]

    if not att_ids:
        raise ValueError("No attachments in this test block — cannot analyze an empty block")

    attachments = db.query(CourseAttachment).filter(CourseAttachment.id.in_(att_ids)).all()

    past_test_atts = [a for a in attachments if a.attachment_kind == CourseAttachmentType.PAST_TEST]
    handout_atts = [
        a for a in attachments
        if a.attachment_kind in (CourseAttachmentType.HANDOUT, CourseAttachmentType.NOTE)
    ]

    if not past_test_atts:
        raise ValueError("No past test in this block — add a past test file before analyzing")
    if not handout_atts:
        raise ValueError("No handouts or notes in this block — add handout/note files before analyzing")

    _MISSING = "(file not found — please re-upload)"
    _NO_TEXT = "(no text extracted — possibly scanned/image PDF)"
    extracted: list[tuple[CourseAttachment, str]] = []

    def get_text(att: CourseAttachment) -> str:
        content = getattr(att, "file_content", None)
        if content is not None:
            text = extract_text_from_bytes(content, att.file_type) or ""
        else:
            resolved = _resolve_file_path(att.file_path)
            if not resolved.exists():
                extracted.append((att, _MISSING))
                return _MISSING
            text = extract_text_from_file(att.file_path, att.file_type) or ""
        if len(text) > _MAX_CHARS_PER_FILE:
            text = text[:_MAX_CHARS_PER_FILE] + "\n\n*[truncated]*"
        out = sanitize_text_for_gemini(text) or _NO_TEXT
        extracted.append((att, out))
        return out

    handout_section = ""
    for att in handout_atts:
        handout_section += f"### {att.file_name}\n{get_text(att)}\n\n"

    test_section = ""
    for att in past_test_atts:
        test_section += f"### {att.file_name}\n{get_text(att)}\n\n"

    # Only fail if we have NO useful text from at least one side of the analysis
    def _has_text(text: str) -> bool:
        return text not in (_MISSING, _NO_TEXT)

    past_test_ok = any(_has_text(t) for a, t in extracted if a.attachment_kind == CourseAttachmentType.PAST_TEST)
    handout_ok = any(_has_text(t) for a, t in extracted if a.attachment_kind in (CourseAttachmentType.HANDOUT, CourseAttachmentType.NOTE))

    if not past_test_ok or not handout_ok:
        missing_names = [a.file_name for a, t in extracted if t == _MISSING]
        no_text_names = [a.file_name for a, t in extracted if t == _NO_TEXT]
        parts = []
        if missing_names:
            parts.append(f"File(s) not found on server (try re-uploading): {', '.join(missing_names)}")
        if no_text_names:
            parts.append(f"File(s) with no extractable text — may be scanned/image PDF: {', '.join(no_text_names)}")
        side = "past test" if not past_test_ok else "handout/note"
        raise ValueError(
            f"Could not extract content from the {side} file(s). "
            + (" | ".join(parts) if parts else "Check that files are text-based PDFs (not scanned).")
        )

    # Sanitize section headers (file names) in case they contain problematic characters
    handout_section = sanitize_text_for_gemini(handout_section)
    test_section = sanitize_text_for_gemini(test_section)
    prompt = (
        "## Handout/Note Materials\n"
        f"{handout_section}"
        "## Test Questions\n"
        f"{test_section}"
        "Analyze how the test draws from the handouts. Return JSON:\n"
        "{\n"
        '  "topic_frequency": {"topic_name": count_of_questions_on_that_topic},\n'
        '  "conversion_patterns": {"verbatim": n, "conceptually_transformed": n, "applied_to_new_scenario": n},\n'
        '  "question_formats": {"multiple_choice": n, "free_response": n, "problem_solving": n, "short_answer": n},\n'
        '  "high_signal_handouts": [{"file_name": "str", "topic_coverage": "str", "question_count": n}],\n'
        '  "summary": "2-3 sentence summary of how this professor converts handout content into exam questions"\n'
        "}"
    )

    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("google-generativeai package not installed")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        ANALYSIS_MODEL,
        system_instruction="You are a professor exam analysis tool. Output valid JSON only.",
        generation_config={
            "response_mime_type": "application/json",
            "max_output_tokens": 4096,
        },
    )
    response = model.generate_content(prompt)

    if not response or not response.text:
        raise RuntimeError("No response from Gemini")

    data = _parse_gemini_json(response.text)

    # Create or replace the CourseTestAnalysis record
    existing = db.query(CourseTestAnalysis).filter(CourseTestAnalysis.test_id == test_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    analysis = CourseTestAnalysis(
        test_id=test_id,
        topic_frequency=data.get("topic_frequency"),
        conversion_patterns=data.get("conversion_patterns"),
        question_formats=data.get("question_formats"),
        high_signal_handouts=data.get("high_signal_handouts"),
        summary=data.get("summary"),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Update the professor's aggregated profile
    if test.course and test.course.professor_id:
        _aggregate_professor_profile(test.course.professor_id, db)

    return analysis


def _aggregate_professor_profile(professor_id: int, db: Session) -> None:
    """
    Merge all CourseTestAnalysis records for all courses taught by this professor
    and write the result back to professor.analysis_profile.
    """
    courses = db.query(Course).filter(Course.professor_id == professor_id).all()
    course_ids = [c.id for c in courses]
    if not course_ids:
        return

    tests = db.query(CourseTest).filter(CourseTest.course_id.in_(course_ids)).all()
    test_ids = [t.id for t in tests]
    if not test_ids:
        return

    analyses = db.query(CourseTestAnalysis).filter(CourseTestAnalysis.test_id.in_(test_ids)).all()
    if not analyses:
        return

    topic_counts: dict[str, int] = {}
    format_counts: dict[str, int] = {}

    for analysis in analyses:
        if analysis.topic_frequency:
            for topic, count in analysis.topic_frequency.items():
                topic_counts[topic] = topic_counts.get(topic, 0) + int(count or 0)
        if analysis.question_formats:
            for fmt, count in analysis.question_formats.items():
                format_counts[fmt] = format_counts.get(fmt, 0) + int(count or 0)

    n = len(analyses)
    confidence = n / (n + 2)  # Laplace smoothing

    tested_topics = sorted(
        [
            {"topic": t, "frequency": c, "confidence": round(confidence, 3)}
            for t, c in topic_counts.items()
        ],
        key=lambda x: x["frequency"],
        reverse=True,
    )

    profile = {
        "tested_topics": tested_topics,
        "preferred_formats": format_counts,
        "test_pairs_analyzed": n,
    }

    professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if professor:
        professor.analysis_profile = profile
        db.commit()
