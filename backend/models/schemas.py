"""Pydantic schemas for API request/response."""
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    sources: Optional[list[dict]] = None


class ReorderAlert(BaseModel):
    sku_id: str
    product_name: str
    category: str
    current_stock: int
    reorder_point: int
    safety_stock: int
    recommended_qty: int
    days_of_supply: Optional[float] = None


class SupplierRecommendation(BaseModel):
    supplier_id: str
    supplier_name: str
    unit_price: Optional[float] = None
    lead_time_days: Optional[int] = None
    reliability_score: Optional[float] = None
    ontime_delivery_rate: Optional[float] = None
    rank: Optional[int] = None
    reason: Optional[str] = None


class AIConfigUpdate(BaseModel):
    forecast_sensitivity: Optional[float] = Field(None, ge=0.5, le=2.0)  # multiplier
    budget_limit_usd: Optional[float] = Field(None, ge=0)
    vendor_weight_price: Optional[float] = Field(None, ge=0, le=1)
    vendor_weight_delivery: Optional[float] = Field(None, ge=0, le=1)
    vendor_weight_reliability: Optional[float] = Field(None, ge=0, le=1)
    low_stock_threshold_pct: Optional[float] = Field(None, ge=0, le=100)


class AIConfigResponse(BaseModel):
    forecast_sensitivity: float
    budget_limit_usd: float
    vendor_weight_price: float
    vendor_weight_delivery: float
    vendor_weight_reliability: float
    low_stock_threshold_pct: float


class PODraftRequest(BaseModel):
    items: list[dict]  # [{sku_id, product_name, qty, unit_price_usd, supplier_id, supplier_name}]
    supplier_id: str
    supplier_name: str
    notes: Optional[str] = None


class RFQRequest(BaseModel):
    product_name: str
    sku_id: Optional[str] = None
    quantity: int
    tone: str = "professional"  # professional | friendly | urgent
    negotiation_strategy: str = "standard"  # standard | aggressive | collaborative
