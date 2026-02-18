"""
One-off migration: add specialties and description to professors table.
Run once for existing deployments: From backend/: python scripts/migrate_professor_specialties.py
New installs get the columns via create_all in main.
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

cur.execute("PRAGMA table_info(professors)")
columns = [row[1] for row in cur.fetchall()]

if "specialties" not in columns:
    cur.execute("ALTER TABLE professors ADD COLUMN specialties TEXT")
    conn.commit()
    print("Added professors.specialties.")
else:
    print("professors.specialties already exists; skip.")

if "description" not in columns:
    cur.execute("ALTER TABLE professors ADD COLUMN description TEXT")
    conn.commit()
    print("Added professors.description.")
else:
    print("professors.description already exists; skip.")

conn.close()
