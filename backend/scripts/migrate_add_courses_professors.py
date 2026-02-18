"""
One-off migration: add professors and courses tables.
Run once for existing deployments: From backend/: python scripts/migrate_add_courses_professors.py
New installs get tables via create_all in main.
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
CREATE TABLE IF NOT EXISTS professors (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users (id)
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_professors_user_id ON professors(user_id)")
conn.commit()

cur.execute("""
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    official_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    professor_id INTEGER,
    syllabus_file_path VARCHAR(512),
    personal_description TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users (id),
    FOREIGN KEY(professor_id) REFERENCES professors (id)
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_courses_user_id ON courses(user_id)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_courses_professor_id ON courses(professor_id)")
conn.commit()
print("Professors and courses tables ready.")
conn.close()
