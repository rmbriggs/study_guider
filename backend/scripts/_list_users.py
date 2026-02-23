import sys, os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
print(f"Total users: {len(users)}")
for u in users:
    print(f"  id={u.id}  username={u.username}  email={u.email}  admin={u.is_admin}")
db.close()
