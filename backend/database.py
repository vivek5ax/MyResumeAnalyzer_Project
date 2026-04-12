import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "resume_analyzer")
MONGODB_CONNECT_TIMEOUT_MS = int(os.getenv("MONGODB_CONNECT_TIMEOUT_MS", "10000"))

client = None
db = None


async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    global client, db
    if not MONGODB_URI:
        print("⚠️ MONGODB_URI is not set. Continuing without database connection.")
        client = None
        db = None
        return

    client = AsyncIOMotorClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=MONGODB_CONNECT_TIMEOUT_MS,
    )
    # Verify connection
    try:
        await client.admin.command('ping')
        print("✓ Successfully connected to MongoDB")
        db = client[DATABASE_NAME]
    except Exception as e:
        print(f"⚠️ Failed to connect to MongoDB during startup: {e}")
        print("⚠️ API will start, but database-backed routes may fail until MongoDB is reachable.")
        client = None
        db = None


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client, db
    if client:
        client.close()
        print("✓ Disconnected from MongoDB")


def get_database():
    """Get database instance"""
    return db
