"""AI Purchase Agent - OpenAI API for procurement Q&A and actions."""
import json
from typing import Any, Optional

from config import get_settings

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


def _openai_direct(messages: list[dict]) -> str:
    settings = get_settings()
    if not settings.openai_api_key or not OPENAI_AVAILABLE:
        return "AI is not configured. Set OPENAI_API_KEY in .env to enable the assistant."
    client = openai.OpenAI(api_key=settings.openai_api_key)
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.3,
    )
    return r.choices[0].message.content or ""


async def chat_with_agent(
    user_message: str,
    context: dict[str, Any],
    system_prompt: Optional[str] = None,
) -> str:
    """
    Send user message to AI with procurement context (vendors, reorder alerts, etc.).
    Uses OpenAI API directly to avoid LangChain/OpenAI version conflicts.
    """
    default_system = """You are an AI Purchase Agent for an e-commerce procurement team.
Answer questions about suppliers, reorder suggestions, low stock, purchase orders, budgets, and cost optimization.
Use only the provided context data. If the data does not contain the answer, say so and suggest what data would help.
Be concise and actionable. When suggesting reorders or vendors, cite specific numbers from the context."""

    system = system_prompt or default_system
    context_str = json.dumps(context, indent=2, default=str)[:12000]  # cap size

    prompt = f"{system}\n\nContext data (use this to answer):\n{context_str}\n\nUser question: {user_message}"
    messages = [{"role": "user", "content": prompt}]
    return _openai_direct(messages)


def generate_rfq_draft(
    product_name: str,
    quantity: int,
    tone: str = "professional",
    negotiation_strategy: str = "standard",
    sku_id: Optional[str] = None,
) -> str:
    """Generate an RFQ (Request for Quotation) email/message draft."""
    settings = get_settings()
    if not settings.openai_api_key or not OPENAI_AVAILABLE:
        return f"[RFQ] Product: {product_name}, Qty: {quantity}. Configure OPENAI_API_KEY for AI-generated drafts."

    prompt = f"""Generate a short professional Request for Quotation (RFQ) message for a supplier.
- Product: {product_name} {f'(SKU: {sku_id})' if sku_id else ''}
- Quantity: {quantity}
- Tone: {tone}
- Negotiation approach: {negotiation_strategy}
Write 2-3 paragraphs only. No subject line."""

    messages = [{"role": "user", "content": prompt}]
    return _openai_direct(messages)


def generate_po_draft_text(items: list[dict], supplier_name: str, notes: Optional[str] = None) -> str:
    """Generate human-readable PO draft summary (full PDF is done in routes)."""
    lines = [f"Purchase Order Draft – Supplier: {supplier_name}", ""]
    total = 0
    for i, row in enumerate(items, 1):
        qty = row.get("qty") or row.get("qty_ordered", 0)
        up = row.get("unit_price_usd") or row.get("unit_price", 0)
        line_total = qty * up
        total += line_total
        lines.append(f"{i}. {row.get('product_name', 'Item')} x {qty} @ ${up:.2f} = ${line_total:.2f}")
    lines.append("")
    lines.append(f"Total: ${total:.2f}")
    if notes:
        lines.append(f"Notes: {notes}")
    return "\n".join(lines)
