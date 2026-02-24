"""
Migration: add course_test_analyses table and professors.analysis_profile column.

Run once from backend/:
    python scripts/migrate_analysis_tables.py
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import inspect, text
from app.db import engine
from app.models.course import CourseTestAnalysis  # noqa: F401 — ensures table metadata is registered


def migrate():
    insp = inspect(engine)
    existing_tables = insp.get_table_names()

    # 1. Create course_test_analyses table if not exists
    if "course_test_analyses" not in existing_tables:
        CourseTestAnalysis.__table__.create(bind=engine)
        print("Created course_test_analyses table.")
    else:
        print("course_test_analyses table already exists; skip.")

    # 2. Add analysis_profile column to professors if not exists
    if "professors" in existing_tables:
        columns = [c["name"] for c in insp.get_columns("professors")]
        if "analysis_profile" not in columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE professors ADD COLUMN analysis_profile JSON"))
                conn.commit()
            print("Added professors.analysis_profile column.")
        else:
            print("professors.analysis_profile already exists; skip.")
    else:
        print("professors table not found; skip analysis_profile column.")

    print("Migration complete.")


if __name__ == "__main__":
    migrate()
