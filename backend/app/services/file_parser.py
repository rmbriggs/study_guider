import tempfile
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from pypdf import PdfReader


class _HTMLTextExtractor(HTMLParser):
    """Strip HTML tags and return plain text."""

    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data: str) -> None:
        t = data.strip()
        if t:
            self._parts.append(t)

    def get_text(self) -> str:
        return "\n\n".join(self._parts).strip()


def _extract_with_pypdf(file_path: Path, use_layout: bool = False) -> str:
    """Use pypdf to extract text; use_layout=True tries layout mode (helps some PDFs)."""
    try:
        # Read bytes first so cloud-synced files (e.g. OneDrive) are fully materialized
        raw = file_path.read_bytes()
        reader = PdfReader(BytesIO(raw))
        parts = []
        for page in reader.pages:
            try:
                if use_layout:
                    text = page.extract_text(extraction_mode="layout")
                else:
                    text = page.extract_text()
            except TypeError:
                text = page.extract_text() if not use_layout else None
            if text is not None and (t := (text if isinstance(text, str) else "").strip()):
                parts.append(t)
        return "\n\n".join(parts).strip() if parts else ""
    except Exception:
        return ""


def _extract_with_pdfplumber(file_path: Path) -> str:
    """Use pdfplumber when pypdf returns nothing; often works on PDFs pypdf misses."""
    try:
        import pdfplumber
        from io import BytesIO as _BytesIO
        parts = []
        raw = file_path.read_bytes()
        with pdfplumber.open(_BytesIO(raw)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and (t := text.strip()):
                    parts.append(t)
        return "\n\n".join(parts).strip() if parts else ""
    except Exception:
        return ""


def extract_text_from_pdf(file_path: str | Path) -> str:
    """Extract text from a PDF file. Tries pypdf (default + layout), then pdfplumber. Returns empty if all fail."""
    path = Path(file_path)
    out = _extract_with_pypdf(path, use_layout=False)
    if not out:
        out = _extract_with_pypdf(path, use_layout=True)
    if not out:
        out = _extract_with_pdfplumber(path)
    return out or ""


def _read_text_file(path: Path) -> str:
    """Read a text file as UTF-8. Used for .txt and .md."""
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def extract_text_from_docx(file_path: str | Path) -> str:
    """Extract text from a .docx file. Returns empty string if extraction fails."""
    try:
        from docx import Document
        doc = Document(file_path)
        parts = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(parts).strip() if parts else ""
    except Exception:
        return ""


def extract_text_from_rtf(file_path: str | Path) -> str:
    """Extract text from an RTF file. Returns empty string if extraction fails."""
    path = Path(file_path)
    try:
        from striprtf.striprtf import rtf_to_text
        raw = path.read_bytes()
        for encoding in ("utf-8", "cp1252", "latin-1"):
            try:
                text = rtf_to_text(raw.decode(encoding, errors="replace"))
                return (text or "").strip()
            except Exception:
                continue
        return ""
    except Exception:
        return ""


def extract_text_from_odt(file_path: str | Path) -> str:
    """Extract text from an .odt file. Returns empty string if extraction fails."""
    try:
        from odf.opendocument import load
        from odf.text import P, H
        doc = load(str(file_path))
        parts = []
        for el in doc.getElementsByType(P) + doc.getElementsByType(H):
            t = _odf_element_text(el)
            if t.strip():
                parts.append(t.strip())
        return "\n\n".join(parts).strip() if parts else ""
    except Exception:
        return ""


def _odf_element_text(el) -> str:
    """Recursively get text from an ODF element."""
    if hasattr(el, "firstChild") and el.firstChild is not None:
        if hasattr(el.firstChild, "data"):
            return el.firstChild.data or ""
        return _odf_element_text(el.firstChild)
    result = []
    for child in (el.childNodes if hasattr(el, "childNodes") else []) or []:
        result.append(_odf_element_text(child))
    return "".join(result)


def extract_text_from_html(file_path: str | Path) -> str:
    """Extract plain text from an HTML file. Returns empty string if extraction fails."""
    path = Path(file_path)
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
        parser = _HTMLTextExtractor()
        parser.feed(raw)
        return parser.get_text()
    except Exception:
        return ""


def _resolve_file_path(file_path: str | Path) -> Path:
    """Resolve to an existing file. Uses a canonical upload base so paths are found
    regardless of where the server was started (cwd) when the path was stored."""
    path = Path(file_path)
    if path.exists():
        return path
    # Try canonical upload base so DB paths from different cwds still resolve
    try:
        from app.config import get_upload_base
        base = get_upload_base()
    except Exception:
        base = None
    if base is not None:
        # Relative path: try under canonical base first
        if not path.is_absolute():
            candidate = base / path
            if candidate.exists():
                return candidate
        # Absolute path that doesn't exist: may have been stored when cwd differed.
        # Rebuild path under canonical base using subdir + filename (e.g. course_files/xyz.pdf)
        for subdir in ("course_files", "syllabi"):
            candidate = base / subdir / path.name
            if candidate.exists():
                return candidate
    # Fallback: try cwd and backend root for relative paths
    if not path.is_absolute():
        for fallback_base in (Path.cwd(), Path(__file__).resolve().parent.parent):
            candidate = (fallback_base / file_path).resolve()
            if candidate.exists():
                return candidate
    return path


def extract_text_from_file(file_path: str | Path, file_type: str) -> str:
    """Extract text based on file type. PDF, txt, md, docx, rtf, odt, html supported for extraction."""
    path = _resolve_file_path(file_path)
    if not path.exists():
        return ""
    ext = (file_type or path.suffix or "").lower().lstrip(".")
    if ext == "pdf":
        return extract_text_from_pdf(path)
    if ext in ("txt", "md"):
        return _read_text_file(path)
    if ext == "docx":
        return extract_text_from_docx(path)
    if ext == "rtf":
        return extract_text_from_rtf(path)
    if ext == "odt":
        return extract_text_from_odt(path)
    if ext in ("html", "htm"):
        return extract_text_from_html(path)
    # .doc (legacy binary) can be uploaded but we don't extract text here
    return ""


def extract_text_from_bytes(content: bytes, file_type: str) -> str:
    """Extract text from file bytes (e.g. from DB). Writes to a temp file and reuses path-based extraction."""
    if not content or not (file_type or "").strip():
        return ""
    ext = (file_type or "").lower().lstrip(".")
    suffix = f".{ext}" if ext else ""
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp.flush()
            tmp_path = tmp.name
        return extract_text_from_file(tmp_path, file_type)
    except Exception:
        return ""
    finally:
        if tmp_path:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except Exception:
                pass
