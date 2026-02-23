"""
One-off migration: add is_admin to users table.
Run once for existing deployments: python scripts/migrate_add_is_admin.py (from backend/)
Or: python -m scripts.migrate_add_is_admin (from backend with PYTHONPATH=.)
"""
import sqlite3
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

db_path = os.path.join(backend_dir, "study_guider.db")
if not os.path.isfile(db_path):
    print("No study_guider.db found; nothing to migrate.")
    sys.exit(0)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("PRAGMA table_info(users)")
columns = [row[1] for row in cur.fetchall()]
if "is_admin" not in columns:
    cur.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL")
    conn.commit()
    print("Added is_admin to users table.")
else:
    print("users.is_admin already exists; skip.")

conn.close()
