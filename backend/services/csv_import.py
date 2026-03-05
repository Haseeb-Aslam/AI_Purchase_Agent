"""CSV/Excel import pipeline for procurement data."""
import os
import pandas as pd
from pathlib import Path
from typing import Optional, Any

# Support both CSV and Excel
DATA_DIR = Path(__file__).resolve().parent.parent.parent  # project root


def _to_native(val: Any) -> Any:
    """Convert numpy/pandas types to native Python for MongoDB BSON."""
    if val is None or isinstance(val, (str, int, float, bool)):
        return val
    if hasattr(val, "item"):  # numpy scalar
        return val.item()
    if hasattr(val, "isoformat"):  # datetime-like
        return val.isoformat() if hasattr(val, "isoformat") else str(val)
    if isinstance(val, dict):
        return {k: _to_native(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_to_native(x) for x in val]
    return str(val)


def _records_to_native(records: list[dict]) -> list[dict]:
    """Ensure all values are BSON-serializable."""
    return [_to_native(r) for r in records]


def _read_csv_or_excel(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    return pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")


def load_suppliers(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("suppliers.csv", "suppliers.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_products(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("products.csv", "products.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_purchase_orders(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("purchase_orders.csv", "purchase_orders.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_sales_history(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("sales_history.csv", "sales_history.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_inventory_snapshots(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("inventory_snapshots.csv", "inventory_snapshots.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_budget_spend(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("budget_spend.csv", "budget_spend.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_supplier_performance(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("supplier_performance.csv", "supplier_performance.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def load_ai_agent_logs(data_dir: Optional[Path] = None) -> list[dict]:
    d = data_dir or DATA_DIR
    for name in ("ai_agent_logs.csv", "ai_agent_logs.xlsx"):
        df = _read_csv_or_excel(d / name)
        if not df.empty:
            df = df.rename(columns=lambda c: c.strip().lower().replace(" ", "_") if isinstance(c, str) else c)
            recs = df.replace({pd.NA: None}).to_dict(orient="records")
            return _records_to_native(recs)
    return []


def import_all(data_dir: Optional[Path] = None) -> dict[str, int]:
    """Load all CSV/Excel files and return counts per collection."""
    data_dir = data_dir or DATA_DIR
    return {
        "suppliers": len(load_suppliers(data_dir)),
        "products": len(load_products(data_dir)),
        "purchase_orders": len(load_purchase_orders(data_dir)),
        "sales_history": len(load_sales_history(data_dir)),
        "inventory_snapshots": len(load_inventory_snapshots(data_dir)),
        "budget_spend": len(load_budget_spend(data_dir)),
        "supplier_performance": len(load_supplier_performance(data_dir)),
        "ai_agent_logs": len(load_ai_agent_logs(data_dir)),
    }
