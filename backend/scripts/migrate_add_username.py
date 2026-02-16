"""
One-off migration: add username to users table.
Backfills existing users with 'user_<id>'. Run once for existing deployments:
  From backend/: python scripts/migrate_add_username.py
New installs get the column via create_all in main.
"""
import sqlite3
import os
import sys
import re

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

if "username" not in columns:
    cur.execute("ALTER TABLE users ADD COLUMN username TEXT")
    conn.commit()
    # Backfill: ensure unique; use user_<id> for existing rows
    cur.execute("SELECT id FROM users")
    for (uid,) in cur.fetchall():
        cur.execute("UPDATE users SET username = ? WHERE id = ?", (f"user_{uid}", uid))
    conn.commit()
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)")
    conn.commit()
    print("Added username to users table and backfilled existing users.")
else:
    print("users.username already exists; skip.")

conn.close()
