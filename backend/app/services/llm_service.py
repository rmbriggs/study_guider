SYSTEM_PROMPT = """You are a study guide generator. Given materials from professor handouts, notes, previous tests, and user preferences, produce a clear, structured study guide in Markdown.

Include:
- A brief overview
- Section headings for major topics
- Key points, definitions, and concepts
- Possible exam topics or question types if the materials suggest them
- Concise summaries where helpful

Write in clear, student-friendly language. Use Markdown for headings, lists, and emphasis."""

GEMINI_MODEL = "gemini-1.5-flash"


def build_user_prompt(course: str, professor_name: str, user_specs: str | None, source_sections: list[tuple[str, str]]) -> str:
    parts = []
    if course or professor_name:
        line = []
        if course:
            line.append(f"Course: {course}")
        if professor_name:
            line.append(f"Professor: {professor_name}")
        parts.append(" ".join(line))
    if user_specs and user_specs.strip():
        parts.append(f"User specifications:\n{user_specs.strip()}")
    parts.append("\n---\nMaterials from uploaded files:\n")
    for label, text in source_sections:
        if text and text.strip():
            parts.append(f"\n### From: {label}\n\n{text.strip()}\n")
    return "\n".join(parts)


def generate_study_guide(course: str, professor_name: str, user_specs: str | None, source_sections: list[tuple[str, str]], api_key: str) -> tuple[str, str]:
    """
    Call Gemini (Google) to generate study guide. Returns (content, model_used).
    source_sections: list of (file_label, extracted_text).
    """
    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("google-generativeai package not installed")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    genai.configure(api_key=api_key)
    user_content = build_user_prompt(course, professor_name, user_specs, source_sections)
    if not user_content.strip():
        return (
            "*No content could be extracted from the uploaded files. Please upload PDF or text files with readable content.*",
            "none",
        )
    model = genai.GenerativeModel(
        GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
        generation_config={"max_output_tokens": 4096},
    )
    response = model.generate_content(user_content)
    if not response or not response.text:
        return ("*No response generated.*", GEMINI_MODEL)
    content = response.text.strip()
    return content, GEMINI_MODEL
