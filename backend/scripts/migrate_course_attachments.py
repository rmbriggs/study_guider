"""
One-off migration: add course_attachments table.
Run once: From backend/: python scripts/migrate_course_attachments.py
New installs get the table via create_all in main.
"""
import sqlite3
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

db_path = os.environ.get("DATABASE_URL", "").replace("sqlite:///", "")
if not db_path:
    db_path = os.path.join(backend_dir, "study_guider.db")
if not os.path.isfile(db_path):
    print("No database file found; nothing to migrate.")
    sys.exit(0)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS course_attachments (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    attachment_kind VARCHAR(32) NOT NULL,
    FOREIGN KEY(course_id) REFERENCES courses (id)
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_course_attachments_course_id ON course_attachments(course_id)")
conn.commit()
print("course_attachments table ready.")
conn.close()
