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
from app.services.file_parser import extract_text_from_file

ANALYSIS_MODEL = "gemini-1.5-flash"
_MAX_CHARS_PER_FILE = 10_000


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

    def get_text(att: CourseAttachment) -> str:
        text = extract_text_from_file(att.file_path, att.file_type) or ""
        if len(text) > _MAX_CHARS_PER_FILE:
            text = text[:_MAX_CHARS_PER_FILE] + "\n\n*[truncated]*"
        return text or "(no text extracted)"

    handout_section = ""
    for att in handout_atts:
        handout_section += f"### {att.file_name}\n{get_text(att)}\n\n"

    test_section = ""
    for att in past_test_atts:
        test_section += f"### {att.file_name}\n{get_text(att)}\n\n"

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

    try:
        data = json.loads(response.text.strip())
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON response: {e}")

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
