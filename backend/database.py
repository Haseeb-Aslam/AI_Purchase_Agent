"""MongoDB connection and database utilities."""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from config import get_settings

settings = get_settings()
client: AsyncIOMotorClient | None = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[settings.mongodb_db]
        await client.admin.command("ping")
        # Create indexes for common queries (collections may not exist yet)
        for name, idx, unique in [
            ("suppliers", "supplier_id", True),
            ("products", "sku_id", True),
            ("ai_config", "key", True),
        ]:
            try:
                await db[name].create_index(idx, unique=unique)
            except Exception:
                pass
        for name, keys in [
            ("purchase_orders", [("order_date", DESCENDING)]),
            ("sales_history", [("sale_date", DESCENDING)]),
            ("inventory_snapshots", [("snapshot_date", DESCENDING), ("sku_id", ASCENDING)]),
            ("budget_spend", [("period", ASCENDING), ("category", ASCENDING)]),
            ("supplier_performance", [("period", ASCENDING), ("supplier_id", ASCENDING)]),
            ("ai_agent_logs", [("created_at", DESCENDING)]),
        ]:
            try:
                await db[name].create_index(keys)
            except Exception:
                pass
    except Exception:
        client = None
        db = None
    return db


async def close_db():
    global client
    if client:
        client.close()


def get_database():
    return db
