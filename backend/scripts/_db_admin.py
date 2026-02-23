"""
Direct admin script using the Railway public database URL.
Usage:
    DATABASE_PUBLIC_URL="postgresql://..." python scripts/_db_admin.py list
    DATABASE_PUBLIC_URL="postgresql://..." python scripts/_db_admin.py grant-admin <user_id>
    DATABASE_PUBLIC_URL="postgresql://..." python scripts/_db_admin.py delete-all
    DATABASE_PUBLIC_URL="postgresql://..." python scripts/_db_admin.py reset-sequence

Set DATABASE_PUBLIC_URL to your Railway PostgreSQL public URL (from Railway dashboard).
Never hardcode credentials in this file.
"""
import sys
import os

PUBLIC_DB_URL = os.environ.get("DATABASE_PUBLIC_URL") or os.environ.get("DATABASE_URL")
if not PUBLIC_DB_URL:
    print("ERROR: Set DATABASE_PUBLIC_URL environment variable before running this script.")
    print("  Example (bash):  DATABASE_PUBLIC_URL='postgresql://...' python scripts/_db_admin.py list")
    print("  Example (Windows cmd):  set DATABASE_PUBLIC_URL=postgresql://... && python scripts/_db_admin.py list")
    sys.exit(1)

os.environ["DATABASE_URL"] = PUBLIC_DB_URL

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(PUBLIC_DB_URL)
Session = sessionmaker(bind=engine)

cmd = sys.argv[1] if len(sys.argv) > 1 else "list"

if cmd == "create-tables":
    from app import models  # noqa: registers all models
    from app.db import Base
    Base.metadata.create_all(bind=engine)
    print("All tables created.")
    sys.exit(0)

db = Session()
try:
    if cmd == "list":
        rows = db.execute(text("SELECT id, username, email, is_admin FROM users ORDER BY id")).fetchall()
        print(f"Total users: {len(rows)}")
        for r in rows:
            print(f"  id={r[0]}  username={r[1]}  email={r[2]}  admin={bool(r[3])}")

    elif cmd == "grant-admin":
        if len(sys.argv) < 3:
            print("Usage: python scripts/_db_admin.py grant-admin <user_id>")
            sys.exit(1)
        uid = int(sys.argv[2])
        db.execute(text("UPDATE users SET is_admin = true WHERE id = :id"), {"id": uid})
        db.commit()
        print(f"Granted admin to user id={uid}")

    elif cmd == "delete-all":
        confirm = input("Type 'yes' to delete all users: ").strip().lower()
        if confirm != "yes":
            print("Aborted.")
            sys.exit(0)
        count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        db.execute(text("DELETE FROM users"))
        db.commit()
        print(f"Deleted {count} user(s).")

    elif cmd == "reset-sequence":
        db.execute(text("ALTER SEQUENCE users_id_seq RESTART WITH 1"))
        db.commit()
        print("User ID sequence reset to 1.")

    else:
        print(f"Unknown command: {cmd}")
finally:
    db.close()
