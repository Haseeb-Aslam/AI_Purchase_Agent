"""Procurement analytics API: overview, trends, inventory, supplier performance, cost breakdown."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from database import get_database
from collections import defaultdict

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _empty_overview(period: str):
    return {
        "period": period,
        "total_purchase_value_usd": 0,
        "orders_placed": 0,
        "average_purchase_cost_usd": 0,
        "total_budget_usd": 0,
        "total_actual_spend_usd": 0,
        "budget_utilization_pct": 0,
    }


@router.get("/overview")
async def get_overview(
    period: str = Query("2026-03", description="YYYY-MM"),
):
    """Total purchase value, orders, avg cost, budget utilization."""
    db = get_database()
    if db is None:
        return _empty_overview(period)

    try:
        pos = await db.purchase_orders.find({"order_date": {"$regex": f"^{period}"}}).to_list(10000)
        if not pos:
            pos = await db.purchase_orders.find({}).to_list(5000)
            pos = [p for p in pos if str(p.get("order_date", ""))[:7] == period]

        total_value = sum(float(p.get("total_value_usd") or 0) for p in pos if p.get("status") != "Cancelled")
        orders_count = len([p for p in pos if p.get("status") not in ("Cancelled",)])
        avg_cost = total_value / orders_count if orders_count else 0

        budget_cursor = await db.budget_spend.find({"period": period}).to_list(100)
        total_budget = sum(float(b.get("budget_usd") or 0) for b in budget_cursor)
        total_actual = sum(float(b.get("actual_spend_usd") or 0) for b in budget_cursor)
        utilization = (total_actual / total_budget * 100) if total_budget else 0
        return {
            "period": period,
            "total_purchase_value_usd": round(total_value, 2),
            "orders_placed": orders_count,
            "average_purchase_cost_usd": round(avg_cost, 2),
            "total_budget_usd": round(total_budget, 2),
            "total_actual_spend_usd": round(total_actual, 2),
            "budget_utilization_pct": round(utilization, 2),
        }
    except Exception:
        return _empty_overview(period)


@router.get("/purchase-trends")
async def get_purchase_trends(
    granularity: str = Query("monthly", enum=["daily", "weekly", "monthly"]),
    start_date: str = Query("2025-01-01"),
    end_date: str = Query("2026-12-31"),
):
    """Time-series purchase trends."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}

    pos = await db.purchase_orders.find({}).to_list(10000)
    by_period = defaultdict(float)
    for p in pos:
        if p.get("status") == "Cancelled":
            continue
        d = p.get("order_date")
        if not d:
            continue
        ds = str(d)[:10]
        if start_date <= ds <= end_date:
            if granularity == "daily":
                key = ds
            elif granularity == "weekly":
                from datetime import datetime as dt
                try:
                    dt_obj = dt.strptime(ds, "%Y-%m-%d")
                    key = dt_obj.strftime("%Y-W%W")
                except Exception:
                    key = ds[:7]
            else:
                key = ds[:7]
            by_period[key] += float(p.get("total_value_usd") or 0)

    points = [{"period": k, "value_usd": round(v, 2)} for k, v in sorted(by_period.items())]
    return {"granularity": granularity, "start_date": start_date, "end_date": end_date, "data": points}


@router.get("/inventory-reorder")
async def get_inventory_reorder(
    low_stock_only: bool = Query(True),
):
    """Low stock items and reorder insights."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}

    inv = await db.inventory_snapshots.find({}).sort("snapshot_date", -1).limit(2000).to_list(2000)
    products = await db.products.find({}).to_list(500)
    # Latest per SKU
    latest_inv = {}
    for row in inv:
        sku = row.get("sku_id")
        if sku and (sku not in latest_inv or (row.get("snapshot_date") or "") > (latest_inv[sku].get("snapshot_date") or "")):
            latest_inv[sku] = row

    low_stock = []
    by_sku = {p.get("sku_id"): p for p in products}
    for sku, row in latest_inv.items():
        stock = row.get("stock_on_hand") or 0
        rp = row.get("reorder_point") or by_sku.get(sku, {}).get("reorder_point") or 0
        if not low_stock_only or stock <= rp:
            low_stock.append({
                "sku_id": sku,
                "product_name": row.get("product_name"),
                "category": row.get("category"),
                "current_stock": stock,
                "reorder_point": rp,
                "below_reorder": stock <= rp,
            })
    return {"low_stock_items": low_stock[:100], "count": len(low_stock)}


@router.get("/supplier-performance")
async def get_supplier_performance(
    period: str = Query("2026-03"),
):
    """On-time delivery, cost comparison, reliability scores."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}

    perf = await db.supplier_performance.find({"period": period}).to_list(500)
    if not perf:
        perf = await db.supplier_performance.find({}).sort("period", -1).limit(200).to_list(200)
        # take latest period
        periods = sorted(set(p.get("period") for p in perf if p.get("period")), reverse=True)
        if periods:
            perf = [p for p in perf if p.get("period") == periods[0]]

    return {
        "period": period,
        "suppliers": [
            {
                "supplier_id": p.get("supplier_id"),
                "supplier_name": p.get("supplier_name"),
                "on_time_delivery_pct": p.get("orders_on_time") and p.get("total_orders") and round(100 * p["orders_on_time"] / p["total_orders"], 2),
                "avg_unit_cost_usd": p.get("avg_unit_cost_usd"),
                "order_accuracy_rate_pct": p.get("order_accuracy_rate_pct"),
                "overall_performance_score": p.get("overall_performance_score"),
            }
            for p in perf
        ],
    }


@router.get("/cost-breakdown")
async def get_cost_breakdown(
    period: str = Query("2026-03"),
):
    """Category-wise spending, top SKUs."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}

    budget = await db.budget_spend.find({"period": period}).to_list(100)
    by_category = {b.get("category"): {"budget_usd": b.get("budget_usd"), "actual_usd": b.get("actual_usd"), "utilization_pct": b.get("utilization_pct")} for b in budget if b.get("category")}

    pos = await db.purchase_orders.find({}).to_list(5000)
    pos = [p for p in pos if str(p.get("order_date", ""))[:7] == period and p.get("status") != "Cancelled"]
    by_sku = defaultdict(float)
    for p in pos:
        sku = p.get("sku_id") or p.get("product_name")
        by_sku[sku] += float(p.get("total_value_usd") or 0)
    top_skus = sorted([{"sku_id": k, "total_usd": round(v, 2)} for k, v in by_sku.items()], key=lambda x: x["total_usd"], reverse=True)[:20]

    return {
        "period": period,
        "by_category": by_category,
        "top_cost_skus": top_skus,
    }


@router.get("/ai-agent-performance")
async def get_ai_agent_performance(
    period: str | None = Query(None),
):
    """Forecast accuracy, suggested vs actual, cost savings from AI logs."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}

    logs = await db.ai_agent_logs.find({}).to_list(1000)
    if period:
        logs = [l for l in logs if str(l.get("period", ""))[:7] == period[:7]]
    if not logs:
        return {"period": period, "forecast_accuracy_avg_pct": None, "cost_savings_usd": 0, "suggested_vs_actual_count": 0}

    accuracies = [float(l.get("forecast_accuracy_pct") or 0) for l in logs if l.get("forecast_accuracy_pct") is not None]
    cost_savings = sum(float(l.get("cost_saving_usd") or 0) for l in logs)
    return {
        "period": period,
        "forecast_accuracy_avg_pct": round(sum(accuracies) / len(accuracies), 2) if accuracies else None,
        "cost_savings_usd": round(cost_savings, 2),
        "suggested_vs_actual_count": len(logs),
    }


@router.get("/export/report")
async def export_report(
    period: str = Query("2026-03"),
    format: str = Query("json", enum=["json", "csv"]),
):
    """Export analytics summary as JSON or CSV (PDF can be added)."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}

    # Build overview inline to avoid circular call
    pos = await db.purchase_orders.find({}).to_list(5000)
    pos = [p for p in pos if str(p.get("order_date", ""))[:7] == period and p.get("status") != "Cancelled"]
    total_value = sum(float(p.get("total_value_usd") or 0) for p in pos)
    orders_count = len(pos)
    overview = {"period": period, "total_purchase_value_usd": round(total_value, 2), "orders_placed": orders_count}

    cost = await get_cost_breakdown(period)
    perf = await get_supplier_performance(period)
    ai_perf = await get_ai_agent_performance(period)

    report = {
        "generated_at": datetime.utcnow().isoformat(),
        "period": period,
        "overview": overview,
        "cost_breakdown": cost,
        "supplier_performance": perf,
        "ai_agent_performance": ai_perf,
    }
    if format == "csv":
        import io
        import csv
        output = io.StringIO()
        w = csv.writer(output)
        w.writerow(["Section", "Key", "Value"])
        for k, v in overview.items():
            w.writerow(["overview", k, v])
        return {"csv": output.getvalue(), "filename": f"procurement_report_{period}.csv"}
    return report
