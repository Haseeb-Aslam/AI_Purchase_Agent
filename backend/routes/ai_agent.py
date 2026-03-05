"""AI Purchase Agent API: chat, vendor comparison, reorder alerts, PO/RFQ drafting, config."""
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from database import get_database
from models.schemas import ChatRequest, ChatResponse, PODraftRequest, RFQRequest, AIConfigUpdate, AIConfigResponse
from services.ai_agent import chat_with_agent, generate_rfq_draft, generate_po_draft_text
from services.analytics import get_low_stock_items, get_suppliers_for_product, rank_suppliers, simple_demand_forecast

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])


async def _get_agent_context_async():
    db = get_database()
    if db is None:
        return {}
    suppliers = await db.suppliers.find({}).to_list(500)
    products = await db.products.find({}).to_list(500)
    inv = await db.inventory_snapshots.find({}).sort("snapshot_date", -1).limit(500).to_list(500)
    pos = await db.purchase_orders.find({}).sort("order_date", -1).limit(200).to_list(200)
    budget = await db.budget_spend.find({}).to_list(200)
    perf = await db.supplier_performance.find({}).sort("period", -1).limit(200).to_list(200)
    low_stock = get_low_stock_items(inv, products, 100)
    return {
        "suppliers_sample": suppliers[:30],
        "products_sample": products[:50],
        "low_stock_alerts": low_stock[:20],
        "recent_purchase_orders_sample": pos[:30],
        "budget_summary": budget[:20],
        "supplier_performance_sample": perf[:30],
    }


@router.post("/chat", response_model=ChatResponse)
async def agent_chat(req: ChatRequest):
    """Chat with the AI Purchase Agent. Context is loaded from DB."""
    session_id = req.session_id or str(uuid.uuid4())
    try:
        context = await _get_agent_context_async()
        reply = await chat_with_agent(req.message, context)
        db = get_database()
        if db is not None:
            try:
                await db.ai_agent_logs.insert_one({
                    "session_id": session_id,
                    "user_message": req.message,
                    "assistant_reply": reply[:500],
                    "created_at": __import__("datetime").datetime.utcnow().isoformat(),
                })
            except Exception:
                pass
        return ChatResponse(reply=reply, session_id=session_id)
    except Exception as e:
        msg = str(e).strip() or "Unknown error"
        if "OPENAI_API_KEY" in msg or "api_key" in msg.lower() or "401" in msg or "Authentication" in msg:
            reply = "AI is not configured or the API key is invalid. Set OPENAI_API_KEY in your environment (e.g. in .env) and restart the app."
        else:
            reply = f"Error: {msg}. Ensure the backend is running and OPENAI_API_KEY is set for AI."
        return ChatResponse(reply=reply, session_id=session_id)


@router.get("/reorder-alerts")
async def reorder_alerts():
    """Low-stock alerts with recommended reorder quantities."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    inv = await db.inventory_snapshots.find({}).sort("snapshot_date", -1).limit(1000).to_list(1000)
    products = await db.products.find({}).to_list(500)
    config = await db.ai_config.find_one({"key": "default"}) or {}
    threshold = config.get("low_stock_threshold_pct") or 100
    alerts = get_low_stock_items(inv, products, threshold)
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/suppliers/recommend")
async def recommend_suppliers(
    sku_id: str | None = None,
    category: str | None = None,
    limit: int = 10,
):
    """Rank suppliers for a product (by sku_id or category)."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    suppliers_cursor = await db.suppliers.find({}).to_list(500)
    suppliers = [s for s in suppliers_cursor if (s.get("active") or "").lower() in ("yes", "true", "1")]
    if not suppliers:
        suppliers = suppliers_cursor
    products = await db.products.find({}).to_list(500)
    perf = await db.supplier_performance.find({}).to_list(500)
    filtered = get_suppliers_for_product(suppliers, products, sku_id, category)
    config = await db.ai_config.find_one({"key": "default"}) or {}
    wp = config.get("vendor_weight_price") or 0.4
    wd = config.get("vendor_weight_delivery") or 0.3
    wr = config.get("vendor_weight_reliability") or 0.3
    ranked = rank_suppliers(filtered, perf, sku_id or category, wp, wd, wr)
    return {"suppliers": ranked[:limit]}


@router.get("/forecast/{sku_id}")
async def demand_forecast(sku_id: str, periods: int = 6):
    """Simple demand forecast for a SKU from sales history."""
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    sales = await db.sales_history.find({"sku_id": sku_id}).to_list(5000)
    forecast = simple_demand_forecast(sales, sku_id, periods)
    return {"sku_id": sku_id, "forecasted_demand_avg": round(forecast, 2), "periods_used": periods}


@router.post("/rfq/draft")
async def draft_rfq(body: RFQRequest):
    """Generate AI RFQ message draft."""
    text = generate_rfq_draft(
        product_name=body.product_name,
        quantity=body.quantity,
        tone=body.tone,
        negotiation_strategy=body.negotiation_strategy,
        sku_id=body.sku_id,
    )
    return {"draft": text}


@router.post("/po/draft")
async def draft_po(body: PODraftRequest):
    """Generate PO draft (text summary). Optionally return PDF via separate endpoint."""
    text = generate_po_draft_text(body.items, body.supplier_name, body.notes)
    total = sum(
        (item.get("qty") or item.get("qty_ordered", 0)) * (item.get("unit_price_usd") or item.get("unit_price", 0))
        for item in body.items
    )
    return {"draft_text": text, "total_usd": round(total, 2), "supplier_id": body.supplier_id, "supplier_name": body.supplier_name}


@router.get("/po/draft/pdf")
async def draft_po_pdf(
    supplier_name: str,
    items_json: str,  # JSON array of {product_name, qty, unit_price_usd}
):
    """Return PO draft as PDF (simple)."""
    import json
    try:
        items = json.loads(items_json)
    except Exception:
        items = []
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from io import BytesIO
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, f"Purchase Order Draft - {supplier_name}")
    y = 720
    total = 0
    for item in items:
        qty = item.get("qty", 0)
        up = item.get("unit_price_usd", 0)
        total += qty * up
        c.drawString(100, y, f"{item.get('product_name', 'Item')} x {qty} @ ${up:.2f}")
        y -= 20
    c.drawString(100, y - 20, f"Total: ${total:.2f}")
    c.save()
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=po_draft.pdf"})


@router.get("/config", response_model=AIConfigResponse)
async def get_ai_config():
    """Get current AI behavior config."""
    db = get_database()
    if db is None:
        return AIConfigResponse(
            forecast_sensitivity=1.0,
            budget_limit_usd=0,
            vendor_weight_price=0.4,
            vendor_weight_delivery=0.3,
            vendor_weight_reliability=0.3,
            low_stock_threshold_pct=100,
        )
    row = await db.ai_config.find_one({"key": "default"})
    if not row:
        return AIConfigResponse(
            forecast_sensitivity=1.0,
            budget_limit_usd=0,
            vendor_weight_price=0.4,
            vendor_weight_delivery=0.3,
            vendor_weight_reliability=0.3,
            low_stock_threshold_pct=100,
        )
    return AIConfigResponse(
        forecast_sensitivity=float(row.get("forecast_sensitivity", 1.0)),
        budget_limit_usd=float(row.get("budget_limit_usd", 0)),
        vendor_weight_price=float(row.get("vendor_weight_price", 0.4)),
        vendor_weight_delivery=float(row.get("vendor_weight_delivery", 0.3)),
        vendor_weight_reliability=float(row.get("vendor_weight_reliability", 0.3)),
        low_stock_threshold_pct=float(row.get("low_stock_threshold_pct", 100)),
    )


@router.put("/config")
async def update_ai_config(body: AIConfigUpdate):
    """Update AI behavior (forecast sensitivity, budget limits, vendor weights)."""
    db = get_database()
    if db is None:
        raise HTTPException(503, "Database not connected")
    update = body.model_dump(exclude_none=True)
    if not update:
        return {"message": "No updates"}
    await db.ai_config.update_one(
        {"key": "default"},
        {"$set": update},
        upsert=True,
    )
    return {"message": "Config updated"}
