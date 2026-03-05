"""Procurement analytics: reorder alerts, demand forecasting, supplier ranking."""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Any


def get_low_stock_items(inventory: list[dict], products: list[dict], threshold_pct: float = 100) -> list[dict]:
    """Items at or below reorder point. threshold_pct: treat as low if stock <= reorder_point * (threshold_pct/100)."""
    by_sku = {p.get("sku_id"): p for p in products if p.get("sku_id")}
    # Use latest snapshot per SKU
    latest = {}
    for inv in inventory:
        sku = inv.get("sku_id")
        date = inv.get("snapshot_date")
        if not sku or not date:
            continue
        if sku not in latest or (isinstance(date, str) and (sku not in latest or date > latest[sku].get("snapshot_date", ""))):
            latest[sku] = inv

    result = []
    for sku, inv in latest.items():
        product = by_sku.get(sku, {})
        stock = inv.get("stock_on_hand") or inv.get("current_stock") or 0
        reorder_point = inv.get("reorder_point") or product.get("reorder_point") or 0
        safety_stock = inv.get("safety_stock") or product.get("safety_stock") or 0
        max_stock = inv.get("max_stock") or product.get("max_stock") or 9999
        threshold = reorder_point * (threshold_pct / 100) if threshold_pct else reorder_point
        if stock <= threshold and reorder_point > 0:
            # Simple reorder qty: reorder_point + safety_stock - current (or 1.5 * reorder_point)
            recommended = max(1, int(reorder_point + safety_stock - stock))
            recommended = min(recommended, max_stock - stock)
            result.append({
                "sku_id": sku,
                "product_name": inv.get("product_name") or product.get("product_name", ""),
                "category": inv.get("category") or product.get("category", ""),
                "current_stock": stock,
                "reorder_point": reorder_point,
                "safety_stock": safety_stock,
                "recommended_reorder_qty": max(1, recommended),
                "days_of_supply": inv.get("days_of_supply"),
            })
    return result


def get_suppliers_for_product(suppliers: list[dict], products: list[dict], sku_id: str | None, category: str | None) -> list[dict]:
    """Filter suppliers that can supply the product (by category or product)."""
    cat = category
    if not cat and sku_id:
        for p in products:
            if p.get("sku_id") == sku_id:
                cat = p.get("category")
                break
    if not cat:
        return list(suppliers)
    result = []
    for s in suppliers:
        cats = s.get("categories_supplied") or ""
        if isinstance(cats, str):
            cat_list = [c.strip() for c in cats.split(";")]
            if cat in cat_list:
                result.append(s)
        elif isinstance(cats, list) and cat in cats:
            result.append(s)
    return result if result else list(suppliers)


def rank_suppliers(
    suppliers: list[dict],
    supplier_performance: list[dict],
    product_sku_or_category: str | None,
    weight_price: float = 0.4,
    weight_delivery: float = 0.3,
    weight_reliability: float = 0.3,
) -> list[dict]:
    """Rank suppliers by price, delivery, reliability. Weights should sum to 1."""
    # Use latest period per supplier
    perf_by_supplier = defaultdict(list)
    for row in supplier_performance:
        sid = row.get("supplier_id")
        if sid:
            perf_by_supplier[sid].append(row)
    for sid in perf_by_supplier:
        perf_by_supplier[sid].sort(key=lambda x: str(x.get("period", "")), reverse=True)

    ranked = []
    for s in suppliers:
        sid = s.get("supplier_id")
        perfs = (perf_by_supplier.get(sid) or [])[:1]
        p = perfs[0] if perfs else {}
        # Normalize to 0-100 for scoring (higher = better)
        price_score = 100 - min(100, (p.get("avg_unit_cost_usd") or s.get("avg_unit_cost_discount_pct") or 0) / 2)
        lead = p.get("avg_lead_time_days") or s.get("avg_lead_time_days") or 30
        delivery_score = max(0, 100 - lead * 2)
        rel = p.get("overall_performance_score") or s.get("reliability_score") or 70
        reliability_score = min(100, float(rel))
        composite = weight_price * price_score + weight_delivery * delivery_score + weight_reliability * reliability_score
        ranked.append({
            **s,
            "unit_price": p.get("avg_unit_cost_usd"),
            "lead_time_days": p.get("avg_lead_time_days") or s.get("avg_lead_time_days"),
            "reliability_score": reliability_score,
            "ontime_delivery_rate": p.get("order_accuracy_rate_pct") or s.get("ontime_delivery_rate_pct"),
            "composite_score": round(composite, 2),
        })
    ranked.sort(key=lambda x: x.get("composite_score", 0), reverse=True)
    for i, r in enumerate(ranked, 1):
        r["rank"] = i
    return ranked


def simple_demand_forecast(sales: list[dict], sku_id: str, periods: int = 4) -> float:
    """Simple average of last N periods demand (qty_sold) for a SKU."""
    by_sku = [r for r in sales if r.get("sku_id") == sku_id]
    if not by_sku:
        return 0.0
    # Aggregate by month
    by_month = defaultdict(float)
    for r in by_sku:
        d = r.get("sale_date") or r.get("sale_date")
        if d:
            if isinstance(d, str):
                month = d[:7]  # YYYY-MM
            else:
                month = d.strftime("%Y-%m") if hasattr(d, "strftime") else str(d)[:7]
            by_month[month] += float(r.get("qty_sold", 0) or 0)
    months = sorted(by_month.keys(), reverse=True)[:periods]
    if not months:
        return 0.0
    total = sum(by_month[m] for m in months)
    return total / len(months)
