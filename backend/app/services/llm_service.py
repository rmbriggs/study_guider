"""
LLM service for study guide generation.

Prompt architecture:
  System instruction  → who Gemini is + professor profile + output format + source weighting
  User turn          → course context + per-material-type labeled sections + reflection checklist

Modular design: edit MATERIAL_INSTRUCTIONS[type] or the block constants below to tune
how Gemini treats any individual material type without touching the rest of the prompt.
"""

GEMINI_MODEL = "gemini-2.5-flash"

# Per-source character cap before truncation (~3 k tokens each)
_MAX_CHARS_PER_SOURCE = 12_000
# Soft cap on total user-turn character length (~18 k tokens)
_MAX_TOTAL_CHARS = 72_000

# ---------------------------------------------------------------------------
# Modular per-material-type instructions
# Edit any entry independently to change how Gemini uses that source type.
# ---------------------------------------------------------------------------
MATERIAL_INSTRUCTIONS: dict[str, str] = {
    "past_test": (
        "These are PAST EXAMS / PAST TESTS — the highest-priority signal.\n"
        "• Extract every topic, question type, and concept that was tested.\n"
        "• Topics appearing across multiple tests are HIGH PRIORITY.\n"
        "• Use question phrasing to understand how the professor frames concepts on exams.\n"
        "• Every tested topic MUST appear in the final study guide."
    ),
    "handout": (
        "These are PROFESSOR HANDOUTS — authoritative course content.\n"
        "• Use the professor's exact terminology for all definitions.\n"
        "• Include every concept, framework, and example the professor chose to present.\n"
        "• Weight these heavily alongside past tests."
    ),
    "note": (
        "These are STUDENT NOTES — supporting context.\n"
        "• Use to elaborate on concepts from handouts.\n"
        "• When notes conflict with handouts, defer to handout wording.\n"
        "• Lower priority than handouts and past tests."
    ),
    "study_guide": (
        "This is a PREVIOUS STUDY GUIDE — structural reference only.\n"
        "• Do not copy it. Identify what it covers and what it misses.\n"
        "• Cross-reference with past tests to find gaps.\n"
        "• Lowest priority; the new guide should improve on it."
    ),
    "other": (
        "SUPPLEMENTARY MATERIAL — use for additional context and breadth of coverage."
    ),
}

_TYPE_HEADING: dict[str, str] = {
    "past_test":   "PAST TESTS  ⟵ Highest priority — primary exam signal",
    "handout":     "PROFESSOR HANDOUTS  ⟵ High priority — authoritative content",
    "note":        "STUDENT NOTES  ⟵ Supporting context",
    "study_guide": "PREVIOUS STUDY GUIDES  ⟵ Structural reference only",
    "other":       "SUPPLEMENTARY MATERIALS",
}

# ---------------------------------------------------------------------------
# System-instruction building blocks (edit these to tune global behavior)
# ---------------------------------------------------------------------------
_WEIGHTING_BLOCK = """\
SOURCE WEIGHTING — when topics conflict or context space is limited, apply in this order:
  1. Past tests        → determines what MUST be in the guide
  2. Professor profile → shapes emphasis, terminology, and tone
  3. Handouts          → authoritative definitions and frameworks
  4. Student notes     → supporting elaboration
  5. Previous study guides → structural reference only
"""

_OUTPUT_FORMAT_BLOCK = """\
OUTPUT FORMAT — respond in Markdown using this exact structure:

## Overview
2–3 sentences covering what this guide focuses on and the highest-priority areas.

## Topics
For each major topic:

### [Topic Name]
**Priority:** HIGH | MEDIUM | LOW
*(HIGH = appears on past tests or explicitly emphasized by the professor)*
**Sources:** [which materials covered this]
- Key concepts, definitions, and details to know

## High-Priority Topics at a Glance
Bulleted list of every HIGH priority topic (quick-reference checklist).

## Practice Questions
8–12 questions modeled on the past tests. Include a brief answer for each.
Format each as:
**Q:** question text
**A:** answer text

## Coverage Gaps
Flag any topics from the materials that were NOT tested in past exams (and vice versa).
"""

_REFLECTION_BLOCK = """\
BEFORE WRITING THE FINAL OUTPUT — silently run this checklist:
1. Every topic from the past tests appears in the Topics section and is marked HIGH.
2. Every HIGH-priority topic has at least one Practice Question.
3. The professor's known emphasis (from their profile) is reflected in the priority labels.
4. No topic is marked HIGH unless it appears in past tests or the professor profile.
Fix any failures before producing the output.
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_system_instruction(
    professor_profile: dict | None,
    professor_analysis: dict | None = None,
) -> str:
    """
    Build the system instruction.
    The professor profile belongs here (not in the user turn) so it acts as
    a persistent lens over every decision Gemini makes.
    """
    base = (
        "You are an expert, exam-focused study guide generator.\n"
        "Your goal is to help students succeed on their specific professor's exams.\n\n"
    )

    if professor_profile:
        name = professor_profile.get("name") or ""
        specialties = professor_profile.get("specialties") or ""
        description = professor_profile.get("description") or ""
        prof_block = f"## Professor Profile: {name}\n"
        if specialties:
            prof_block += f"Specialties: {specialties}\n"
        if description:
            prof_block += f"Teaching style and emphasis: {description}\n"
        prof_block += (
            "\nUse this profile to:\n"
            "• Mirror this professor's terminology and reasoning style.\n"
            "• Elevate topics this professor is known to emphasize.\n"
            "• Frame all explanations the way this professor would.\n\n"
        )
        base += prof_block

    quiz_qa = (professor_profile or {}).get("quiz_qa") if professor_profile else []
    if quiz_qa:
        base += "## Student's answers about this professor (use to tailor the study guide):\n"
        for pair in quiz_qa:
            q = (pair.get("question") or "").strip()
            a = (pair.get("answer") or "").strip()
            if q or a:
                base += f"Q: {q or '—'}\nA: {a or '—'}\n\n"
        base += "\n"

    if professor_analysis:
        tested_topics = professor_analysis.get("tested_topics") or []
        preferred_formats = professor_analysis.get("preferred_formats") or {}
        pairs_analyzed = professor_analysis.get("test_pairs_analyzed") or 0
        if tested_topics or preferred_formats:
            analysis_block = "## Professor's Historical Exam Patterns\n"
            if tested_topics:
                topic_list = ", ".join(t["topic"] for t in tested_topics[:10])
                analysis_block += f"Topics this professor consistently tests (ordered by frequency): {topic_list}\n"
            if preferred_formats:
                fmt_parts = [f"{fmt}: {n}" for fmt, n in preferred_formats.items() if n > 0]
                if fmt_parts:
                    analysis_block += f"Preferred question formats: {', '.join(fmt_parts)}\n"
            if pairs_analyzed:
                analysis_block += f"Based on {pairs_analyzed} analyzed test-handout pair(s).\n"
            base += analysis_block + "\n"

    return base + _WEIGHTING_BLOCK + "\n" + _OUTPUT_FORMAT_BLOCK + "\n" + _REFLECTION_BLOCK


def build_user_prompt(
    course: str,
    professor_name: str,
    user_specs: str | None,
    typed_sources: list[tuple[str, str, str]],  # (material_type, label, text)
    block_analyses: list | None = None,
) -> str:
    """
    Build the user-turn prompt.
    Sources are grouped by material type, each group prefixed with its
    instructions so Gemini knows exactly how to use each one.
    """
    parts: list[str] = []

    # Context header
    header: list[str] = []
    if course:
        header.append(f"**Course:** {course}")
    if professor_name:
        header.append(f"**Professor:** {professor_name}")
    if header:
        parts.append("\n".join(header))

    if user_specs and user_specs.strip():
        parts.append(f"\n**Student's special instructions:**\n{user_specs.strip()}")

    # Historical test analysis — inserted before the uploaded files
    if block_analyses:
        analysis_lines = ["\n---\n## Historical Test Analysis"]
        for ba in block_analyses:
            summary = (ba.get("summary") or "").strip()
            if summary:
                analysis_lines.append(f"\n**Analysis:** {summary}")
            high_signal = ba.get("high_signal_handouts") or []
            for hs in high_signal:
                fname = hs.get("file_name", "")
                coverage = hs.get("topic_coverage", "")
                qcount = hs.get("question_count", 0)
                analysis_lines.append(f"- **{fname}**: {coverage} ({qcount} question(s) from this source)")
            topic_freq = ba.get("topic_frequency") or {}
            zero_topics = [t for t, c in topic_freq.items() if not c]
            for zt in zero_topics:
                analysis_lines.append(f"  ⚠ Not yet tested — treat as lower priority: {zt}")
        parts.append("\n".join(analysis_lines))

    # Group sources by material type
    grouped: dict[str, list[tuple[str, str]]] = {}
    for mtype, label, text in typed_sources:
        if text and text.strip():
            grouped.setdefault(mtype, []).append((label, text))

    if not grouped:
        return "\n".join(parts) if parts else ""

    type_order = ["past_test", "handout", "note", "study_guide", "other"]
    total_chars = sum(len(p) for p in parts)

    for mtype in type_order:
        if mtype not in grouped:
            continue
        heading = _TYPE_HEADING.get(mtype, mtype.upper())
        instruction = MATERIAL_INSTRUCTIONS.get(mtype, "")
        parts.append(f"\n---\n## {heading}\n_{instruction}_")
        for label, text in grouped[mtype]:
            if total_chars >= _MAX_TOTAL_CHARS:
                parts.append(f"\n### {label}\n*[Omitted — total context limit reached]*\n")
                continue
            truncated = _truncate_text(text, _MAX_CHARS_PER_SOURCE)
            total_chars += len(truncated)
            parts.append(f"\n### {label}\n\n{truncated}\n")

    return "\n".join(parts)


def generate_study_guide(
    course: str,
    professor_name: str,
    user_specs: str | None,
    typed_sources: list[tuple[str, str, str]],  # (material_type, label, text)
    professor_profile: dict | None,
    api_key: str,
    block_analyses: list | None = None,
    professor_analysis: dict | None = None,
) -> tuple[str, str]:
    """
    Call Gemini to generate a study guide.
    Returns (markdown_content, model_used).
    """
    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("google-generativeai package not installed")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")

    system_instruction = build_system_instruction(professor_profile, professor_analysis)
    user_content = build_user_prompt(course, professor_name, user_specs, typed_sources, block_analyses)

    if not user_content.strip():
        return (
            "*No content could be extracted from the uploaded files. "
            "Please upload PDF, TXT, MD, DOC, DOCX, RTF, ODT, or HTML files with readable content.*",
            "none",
        )

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        GEMINI_MODEL,
        system_instruction=system_instruction,
        generation_config={"max_output_tokens": 8192},
    )
    response = model.generate_content(user_content)
    if not response or not response.text:
        return ("*No response generated.*", GEMINI_MODEL)
    return response.text.strip(), GEMINI_MODEL


def generate_professor_quiz_questions(
    professor_name: str,
    specialties: str | None,
    description: str | None,
    api_key: str,
) -> list[dict]:
    """
    Call Gemini to generate exactly 5 short questions that help tailor a study guide
    for this professor. Returns list of {"id": "q1", "text": "..."} with ids q1..q5.
    """
    try:
        import json
        import re
    except ImportError:
        pass
    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("google-generativeai package not installed")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")

    system = (
        "You are a helpful assistant that creates short survey questions for students "
        "about their professor. Your output will be parsed as JSON. "
        "Respond with ONLY a valid JSON array of exactly 5 objects. "
        "Each object must have exactly two keys: \"id\" (string: \"q1\", \"q2\", \"q3\", \"q4\", \"q5\") "
        "and \"text\" (string: the question, one short sentence). "
        "No markdown, no code fences, no explanation — only the JSON array."
    )
    parts = [f"Professor name: {professor_name or 'Unknown'}."]
    if specialties and specialties.strip():
        parts.append(f"Their specialties: {specialties.strip()}.")
    if description and description.strip():
        parts.append(f"Additional context: {description.strip()}")
    parts.append(
        "Generate exactly 5 questions that help tailor a study guide for this professor. "
        "Focus on: exam style, what they emphasize, question formats they use, topics they care about, "
        "or weak areas the student wants to focus on. Keep each question concise and useful for study guide generation."
    )
    user_content = " ".join(parts)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        GEMINI_MODEL,
        system_instruction=system,
        generation_config={"max_output_tokens": 1024},
    )
    response = model.generate_content(user_content)
    if not response or not response.text:
        raise ValueError("No response generated for quiz questions")

    raw = response.text.strip()
    # Strip markdown code fence if present
    if "```" in raw:
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$", "", raw)
    data = json.loads(raw)
    if not isinstance(data, list):
        data = [data]
    # Normalize to q1..q5 with id and text
    result = []
    for i, item in enumerate(data[:5]):
        if isinstance(item, dict):
            qid = item.get("id") or f"q{i + 1}"
            text = item.get("text") or str(item.get("question", "")) or f"Question {i + 1}"
        else:
            qid = f"q{i + 1}"
            text = str(item) if item else f"Question {i + 1}"
        if not qid.startswith("q"):
            qid = f"q{i + 1}"
        result.append({"id": qid, "text": text[:500]})
    # Ensure exactly 5 with ids q1..q5
    while len(result) < 5:
        result.append({"id": f"q{len(result) + 1}", "text": f"Question {len(result) + 1}."})
    return result[:5]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _truncate_text(text: str, max_chars: int) -> str:
    """Truncate text to max_chars, breaking on a newline boundary where possible."""
    if len(text) <= max_chars:
        return text
    cutoff = text.rfind("\n", 0, max_chars)
    cutoff = cutoff if cutoff > max_chars // 2 else max_chars
    omitted = len(text) - cutoff
    return text[:cutoff] + f"\n\n*[Source truncated — {omitted:,} characters omitted]*"
