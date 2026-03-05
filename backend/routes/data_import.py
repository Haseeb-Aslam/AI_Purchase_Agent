"""Data import API - load CSV/Excel into MongoDB."""
import os
from pathlib import Path
from fastapi import APIRouter
from database import get_database

from services.csv_import import (
    load_suppliers,
    load_products,
    load_purchase_orders,
    load_sales_history,
    load_inventory_snapshots,
    load_budget_spend,
    load_supplier_performance,
    load_ai_agent_logs,
    DATA_DIR,
)

router = APIRouter(prefix="/api/import", tags=["Import"])


def _get_data_dir(data_dir: str | None) -> Path:
    if data_dir:
        return Path(data_dir).resolve()
    env_dir = os.environ.get("DATA_DIR")
    return Path(env_dir) if env_dir else DATA_DIR


@router.post("/all")
async def import_all_data(data_dir: str | None = None):
    """Import all CSV/Excel files from project data directory into MongoDB."""
    try:
        db = get_database()
        if db is None:
            return {"error": "Database not connected", "imported": {}}
        base = _get_data_dir(data_dir)
        if not base.exists():
            return {"error": f"Data directory not found: {base}. In Docker use /app/data.", "imported": {}}
        counts = {}

        for name, loader in [
            ("suppliers", load_suppliers),
            ("products", load_products),
            ("purchase_orders", load_purchase_orders),
            ("sales_history", load_sales_history),
            ("inventory_snapshots", load_inventory_snapshots),
            ("budget_spend", load_budget_spend),
            ("supplier_performance", load_supplier_performance),
            ("ai_agent_logs", load_ai_agent_logs),
        ]:
            try:
                data = loader(base)
                if data:
                    col = db[name]
                    await col.delete_many({})
                    result = await col.insert_many(data)
                    counts[name] = len(result.inserted_ids)
                else:
                    counts[name] = 0
            except Exception as e:
                counts[name] = f"error: {str(e)}"

        return {"imported": counts}
    except Exception as e:
        return {"error": str(e), "imported": {}}
