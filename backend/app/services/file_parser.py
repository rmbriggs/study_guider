import os
from pathlib import Path
from pypdf import PdfReader


def extract_text_from_pdf(file_path: str | Path) -> str:
    """Extract text from a PDF file. Returns empty string if extraction fails."""
    try:
        reader = PdfReader(file_path)
        parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
        return "\n\n".join(parts).strip() if parts else ""
    except Exception:
        return ""


def extract_text_from_file(file_path: str | Path, file_type: str) -> str:
    """Extract text based on file type. PDF and txt supported."""
    path = Path(file_path)
    if not path.exists():
        return ""
    ext = (file_type or path.suffix or "").lower().lstrip(".")
    if ext == "pdf":
        return extract_text_from_pdf(path)
    if ext == "txt":
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            return ""
    return ""
