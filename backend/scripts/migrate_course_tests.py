"""
One-off migration: add course_tests table and course_attachments.test_id.
Run once: From backend/: python scripts/migrate_course_tests.py
Existing attachments get test_id = NULL (Uncategorized).
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
CREATE TABLE IF NOT EXISTS course_tests (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(course_id) REFERENCES courses (id)
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_course_tests_course_id ON course_tests(course_id)")

# Add test_id to course_attachments if not present
cur.execute("PRAGMA table_info(course_attachments)")
columns = [row[1] for row in cur.fetchall()]
if "test_id" not in columns:
    cur.execute("ALTER TABLE course_attachments ADD COLUMN test_id INTEGER REFERENCES course_tests(id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_course_attachments_test_id ON course_attachments(test_id)")
    print("Added test_id to course_attachments.")
else:
    print("course_attachments.test_id already exists; skip.")

conn.commit()
print("course_tests table ready.")
conn.close()
