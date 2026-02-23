"""
Migration: add material_type column to guide_sources table.
Works with both SQLite and PostgreSQL.

Run from backend/:
    python scripts/migrate_add_material_type.py
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
    columns = [col["name"] for col in inspector.get_columns("guide_sources")]
    if "material_type" in columns:
        print("guide_sources.material_type already exists; skipping.")
    else:
        conn.execute(text("ALTER TABLE guide_sources ADD COLUMN material_type VARCHAR(32)"))
        conn.commit()
        print("Added material_type to guide_sources.")
