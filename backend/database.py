import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "resume_analyzer")

client = None
db = None


async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    global client, db
    client = AsyncIOMotorClient(MONGODB_URI)
    # Verify connection
    try:
        await client.admin.command('ping')
        print("✓ Successfully connected to MongoDB")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        raise
    db = client[DATABASE_NAME]


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client, db
    if client:
        client.close()
        print("✓ Disconnected from MongoDB")


def get_database():
    """Get database instance"""
    return db
