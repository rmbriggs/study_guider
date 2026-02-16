# Study Guider

Generate study guides from professor handouts, notes, previous tests, and your specifications. React frontend + FastAPI backend.

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set:

- `SECRET_KEY` – used for JWT signing
- `GEMINI_API_KEY` – required for generating study guides (get one at aistudio.google.com/apikey)
- **Email (optional)** – For email verification and password reset, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL`. Set `FRONTEND_BASE_URL` to your frontend URL (e.g. `http://localhost:5173`) so verification and reset links work. If SMTP is not configured, the app still runs; verification/reset links and codes are only logged to the console.

If you have an existing database, run the one-off migration to add the `email_verified` column:

```bash
cd backend
python scripts/migrate_add_email_verification.py
```

Run the API:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

Start the backend first (see above), then:

```bash
cd frontend
npm install
npm run dev
```

Open https://localhost:5173. The dev server uses a self-signed certificate—accept the browser warning once (e.g. "Advanced" → "Proceed to localhost"). The dev server proxies `/api` to the backend. If you run the frontend without the dev server, set `VITE_API_URL=http://127.0.0.1:8000/api` so the app can reach the API.

## Usage

1. Register or log in. After signup you must verify your email (via the link or 6-digit code sent to you) before you can create study guides; you can still browse the app.
2. Click **Create study guide** and fill in:
   - Title, professor/course, and any instructions.
   - Upload one or more PDF or TXT files (handouts, notes, past tests).
3. Click **Generate study guide**. The app extracts text, sends it to the LLM, and saves the result.
4. Open a guide from the dashboard to read or copy the markdown.

## Tech

- **Frontend**: React (Vite), React Router, Axios, react-markdown, Lucide icons. Styling from `Design Inspo` (design-system-preview.html / STYLE_GUIDE.md).
- **Backend**: FastAPI, SQLAlchemy (SQLite), JWT auth, pypdf for PDF text extraction, Google Gemini API for generation.
