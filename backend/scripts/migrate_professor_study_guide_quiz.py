"""
Migration: add professors.study_guide_quiz column (JSON, nullable).

Run once from backend/:
    python scripts/migrate_professor_study_guide_quiz.py
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import inspect, text
from app.db import engine


def migrate():
    insp = inspect(engine)
    if "professors" not in insp.get_table_names():
        print("professors table not found; skip.")
        return
    columns = [c["name"] for c in insp.get_columns("professors")]
    if "study_guide_quiz" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE professors ADD COLUMN study_guide_quiz JSON"))
            conn.commit()
        print("Added professors.study_guide_quiz column.")
    else:
        print("professors.study_guide_quiz already exists; skip.")
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
