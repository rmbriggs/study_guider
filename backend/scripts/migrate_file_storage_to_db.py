"""
Add columns to store file content in the database (for Railway / ephemeral filesystem).
Run once: from backend/ with DATABASE_URL set, or default sqlite:
  python scripts/migrate_file_storage_to_db.py
Safe to run multiple times (skips if column exists).
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.db import engine
from app.config import get_settings

def run():
    settings = get_settings()
    url = (settings.database_url or "").lower()
    is_postgres = "postgresql" in url or "postgres" in url

    if is_postgres:
        # PostgreSQL: BYTEA for binary content
        alters = [
            ("courses", "syllabus_file_data", "BYTEA"),
            ("course_attachments", "file_content", "BYTEA"),
            ("guide_sources", "file_content", "BYTEA"),
        ]
    else:
        # SQLite: BLOB
        alters = [
            ("courses", "syllabus_file_data", "BLOB"),
            ("course_attachments", "file_content", "BLOB"),
            ("guide_sources", "file_content", "BLOB"),
        ]

    with engine.begin() as conn:
        for table, column, col_type in alters:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                print(f"Added {table}.{column}")
            except Exception as e:
                msg = str(e).lower()
                if "already exists" in msg or "duplicate column" in msg:
                    print(f"Column {table}.{column} already exists; skip.")
                else:
                    raise

if __name__ == "__main__":
    run()
    print("File storage migration done.")
