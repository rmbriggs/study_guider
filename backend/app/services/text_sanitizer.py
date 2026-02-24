"""
Sanitize text before sending to Gemini (or other LLM) APIs.
Removes or replaces characters that can cause 400/invalid request or encoding issues.
"""

import re


def sanitize_text_for_gemini(text: str) -> str:
    """
    Make text safe for Gemini API: valid UTF-8, no null/control characters.
    Keeps tab, newline, carriage return; replaces other control chars and invalid Unicode.
    """
    if not text:
        return text
    # Ensure we have a string and normalize invalid UTF-8 / surrogates
    if isinstance(text, bytes):
        text = text.decode("utf-8", errors="replace")
    # Replace surrogate code points (invalid in UTF-8 when not part of a pair)
    text = text.encode("utf-8", errors="replace").decode("utf-8")
    # Remove null bytes (Gemini can reject these)
    text = text.replace("\x00", "")
    # Replace control characters (0x01-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) with space. Keep \t \n \r.
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    return text
