"""
Migration: add course_attachments.allow_multiple_blocks (per-file toggle for multi-block assignment).

Run once from backend/:
    python scripts/migrate_attachment_allow_multiple_blocks.py
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import inspect, text
from app.db import engine

with engine.connect() as conn:
    inspector = inspect(engine)
    if "course_attachments" not in inspector.get_table_names():
        print("course_attachments table not found; skip.")
        sys.exit(0)

    columns = [c["name"] for c in inspector.get_columns("course_attachments")]
    if "allow_multiple_blocks" in columns:
        print("course_attachments.allow_multiple_blocks already exists; skip.")
        sys.exit(0)

    # SQLite: 0/1 for boolean; PostgreSQL accepts BOOLEAN DEFAULT FALSE
    conn.execute(text(
        "ALTER TABLE course_attachments ADD COLUMN allow_multiple_blocks INTEGER NOT NULL DEFAULT 0"
    ))
    conn.commit()
    print("Added course_attachments.allow_multiple_blocks.")
