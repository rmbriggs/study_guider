"""
Migration: create course_attachment_tests table (many-to-many for attachments ↔ tests).
Works with both SQLite and PostgreSQL.

Run once from backend/:
    python scripts/migrate_course_attachment_tests.py
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
    existing_tables = inspector.get_table_names()

    if "course_attachment_tests" in existing_tables:
        print("course_attachment_tests already exists; skipping table creation.")
    else:
        conn.execute(text("""
            CREATE TABLE course_attachment_tests (
                attachment_id INTEGER NOT NULL,
                test_id INTEGER NOT NULL,
                PRIMARY KEY (attachment_id, test_id),
                FOREIGN KEY(attachment_id) REFERENCES course_attachments (id) ON DELETE CASCADE,
                FOREIGN KEY(test_id) REFERENCES course_tests (id) ON DELETE CASCADE
            )
        """))
        conn.execute(text(
            "CREATE INDEX ix_course_attachment_tests_attachment_id "
            "ON course_attachment_tests(attachment_id)"
        ))
        conn.execute(text(
            "CREATE INDEX ix_course_attachment_tests_test_id "
            "ON course_attachment_tests(test_id)"
        ))

        # Backfill from legacy single-assignment test_id column
        conn.execute(text("""
            INSERT INTO course_attachment_tests (attachment_id, test_id)
            SELECT id, test_id
            FROM course_attachments
            WHERE test_id IS NOT NULL
            ON CONFLICT DO NOTHING
        """))

        conn.commit()
        print("Created course_attachment_tests table and backfilled from course_attachments.test_id.")
