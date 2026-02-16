"""
One-off migration: add email_verified to users table.
Run once for existing deployments: python -m app.scripts.migrate_add_email_verification
Or from backend/: python scripts/migrate_add_email_verification.py
New tables (email_verifications, password_reset_tokens) are created by create_all in main.
"""
import sqlite3
import os
import sys

# Run from backend directory or project root
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

db_path = os.path.join(backend_dir, "study_guider.db")
if not os.path.isfile(db_path):
    print("No study_guider.db found; nothing to migrate.")
    sys.exit(0)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check if column already exists (idempotent)
cur.execute("PRAGMA table_info(users)")
columns = [row[1] for row in cur.fetchall()]
if "email_verified" not in columns:
    cur.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 NOT NULL")
    conn.commit()
    print("Added email_verified to users table.")
else:
    print("users.email_verified already exists; skip.")

conn.close()
