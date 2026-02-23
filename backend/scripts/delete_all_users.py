"""
Delete every user and all their associated data (guides, courses, professors,
verification tokens, reset tokens) from the database.

Usage (from backend/):
    python scripts/delete_all_users.py
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db import SessionLocal
from app.models.user import User

yes_flag = "--yes" in sys.argv

db = SessionLocal()
try:
    count = db.query(User).count()
    if count == 0:
        print("No users in the database. Nothing to delete.")
        sys.exit(0)

    print(f"WARNING: This will permanently delete {count} user(s) and all their data.")
    if not yes_flag:
        confirm = input("Type 'yes' to confirm: ").strip().lower()
        if confirm != "yes":
            print("Aborted.")
            sys.exit(0)

    db.query(User).delete()
    db.commit()
    print(f"Deleted {count} user(s) and all associated data.")
finally:
    db.close()
