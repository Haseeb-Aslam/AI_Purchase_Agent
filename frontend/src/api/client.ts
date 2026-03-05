const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) return res.json() as Promise<T>
  return res.text() as Promise<T>
}

export const api = {
  // Import
  importAll: (dataDir?: string) =>
    request<{ imported: Record<string, number | string> }>(
      `/import/all${dataDir ? `?data_dir=${encodeURIComponent(dataDir)}` : ''}`,
      { method: 'POST' }
    ),

  // Analytics
  overview: (period: string) => request<Overview>(`/analytics/overview?period=${encodeURIComponent(period)}`),
  purchaseTrends: (params: { granularity?: string; start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ data: { period: string; value_usd: number }[] }>(`/analytics/purchase-trends?${q}`)
  },
  inventoryReorder: (lowStockOnly = true) =>
    request<{ low_stock_items: LowStockItem[] }>(`/analytics/inventory-reorder?low_stock_only=${lowStockOnly}`),
  supplierPerformance: (period: string) =>
    request<{ suppliers: SupplierPerf[] }>(`/analytics/supplier-performance?period=${encodeURIComponent(period)}`),
  costBreakdown: (period: string) =>
    request<CostBreakdown>(`/analytics/cost-breakdown?period=${encodeURIComponent(period)}`),
  aiAgentPerformance: (period?: string) =>
    request<AIAgentPerf>(`/analytics/ai-agent-performance${period ? `?period=${period}` : ''}`),
  exportReport: (period: string, format: 'json' | 'csv') =>
    request<ReportExport>(`/analytics/export/report?period=${encodeURIComponent(period)}&format=${format}`),

  // AI Agent
  chat: (message: string, sessionId?: string) =>
    request<{ reply: string; session_id: string }>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    }),
  reorderAlerts: () => request<{ alerts: ReorderAlert[] }>('/agent/reorder-alerts'),
  recommendSuppliers: (skuId?: string, category?: string, limit?: number) => {
    const p = new URLSearchParams()
    if (skuId) p.set('sku_id', skuId)
    if (category) p.set('category', category)
    if (limit) p.set('limit', String(limit))
    return request<{ suppliers: SupplierRec[] }>(`/agent/suppliers/recommend?${p}`)
  },
  forecast: (skuId: string, periods?: number) =>
    request<{ forecasted_demand_avg: number }>(`/agent/forecast/${skuId}${periods ? `?periods=${periods}` : ''}`),
  rfqDraft: (body: { product_name: string; quantity: number; tone?: string; negotiation_strategy?: string; sku_id?: string }) =>
    request<{ draft: string }>('/agent/rfq/draft', { method: 'POST', body: JSON.stringify(body) }),
  poDraft: (body: { items: Record<string, unknown>[]; supplier_id: string; supplier_name: string; notes?: string }) =>
    request<{ draft_text: string; total_usd: number }>('/agent/po/draft', { method: 'POST', body: JSON.stringify(body) }),
  poDraftPdfUrl: (supplierName: string, items: { product_name: string; qty: number; unit_price_usd: number }[]) =>
    `/api/agent/po/draft/pdf?supplier_name=${encodeURIComponent(supplierName)}&items_json=${encodeURIComponent(JSON.stringify(items))}`,
  getConfig: () => request<AIConfig>('/agent/config'),
  updateConfig: (body: Partial<AIConfig>) =>
    request<{ message: string }>('/agent/config', { method: 'PUT', body: JSON.stringify(body) }),
}

export interface Overview {
  period: string
  total_purchase_value_usd: number
  orders_placed: number
  average_purchase_cost_usd: number
  total_budget_usd: number
  budget_utilization_pct: number
}

export interface LowStockItem {
  sku_id: string
  product_name: string
  category: string
  current_stock: number
  reorder_point: number
  below_reorder: boolean
}

export interface SupplierPerf {
  supplier_id: string
  supplier_name: string
  on_time_delivery_pct?: number
  avg_unit_cost_usd?: number
  order_accuracy_rate_pct?: number
  overall_performance_score?: number
}

export interface CostBreakdown {
  period: string
  by_category: Record<string, { budget_usd?: number; actual_usd?: number; utilization_pct?: number }>
  top_cost_skus: { sku_id: string; total_usd: number }[]
}

export interface AIAgentPerf {
  period?: string
  forecast_accuracy_avg_pct?: number
  cost_savings_usd: number
  suggested_vs_actual_count: number
}

export interface ReportExport {
  overview?: Overview
  cost_breakdown?: CostBreakdown
  csv?: string
  filename?: string
}

export interface ReorderAlert {
  sku_id: string
  product_name: string
  category: string
  current_stock: number
  reorder_point: number
  safety_stock: number
  recommended_reorder_qty: number
  days_of_supply?: number
}

export interface SupplierRec {
  supplier_id: string
  supplier_name: string
  unit_price?: number
  lead_time_days?: number
  reliability_score?: number
  ontime_delivery_rate_pct?: number
  rank?: number
  composite_score?: number
}

export interface AIConfig {
  forecast_sensitivity: number
  budget_limit_usd: number
  vendor_weight_price: number
  vendor_weight_delivery: number
  vendor_weight_reliability: number
  low_stock_threshold_pct: number
}
