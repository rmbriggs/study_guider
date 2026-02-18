"""
One-off migration: add course column to study_guides table.
Run once for existing deployments: From backend/: python scripts/migrate_add_course.py
New installs get the column via create_all in main.
"""
import sqlite3
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Use same DB path as app if available
db_path = os.environ.get("DATABASE_URL", "").replace("sqlite:///", "")
if not db_path:
    db_path = os.path.join(backend_dir, "study_guider.db")
if not os.path.isfile(db_path):
    print("No database file found; nothing to migrate.")
    sys.exit(0)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("PRAGMA table_info(study_guides)")
columns = [row[1] for row in cur.fetchall()]

if "course" not in columns:
    cur.execute("ALTER TABLE study_guides ADD COLUMN course VARCHAR(255) NOT NULL DEFAULT ''")
    conn.commit()
    print("Added course to study_guides table.")
else:
    print("study_guides.course already exists; skip.")

conn.close()
