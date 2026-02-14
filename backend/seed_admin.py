import asyncio
from app.core.database import db
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def seed_admin():
    db.connect()
    
    # Check if admin already exists
    admin_username = "admin"
    existing_admin = await db.db["users"].find_one({"username": admin_username})
    
    if existing_admin:
        print("Admin user already exists.")
        db.close()
        return

    print("Creating admin user...")
    hashed_password = get_password_hash("1234")
    admin_user = User(
        username=admin_username,
        name="System Admin",
        role=UserRole.ADMIN,
        password_hash=hashed_password
    )
    
    await db.db["users"].insert_one(admin_user.model_dump(by_alias=True, exclude={"id"}))
    print("Admin user created successfully (username: admin, password: 1234).")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
