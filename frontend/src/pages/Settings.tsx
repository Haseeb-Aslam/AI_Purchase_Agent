import { useState, useEffect } from 'react'
import { api, AIConfig } from '../api/client'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AIConfig>({
    forecast_sensitivity: 1,
    budget_limit_usd: 0,
    vendor_weight_price: 0.4,
    vendor_weight_delivery: 0.3,
    vendor_weight_reliability: 0.3,
    low_stock_threshold_pct: 100,
  })

  useEffect(() => {
    api.getConfig()
      .then((c) => setForm(c))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateConfig(form)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '1rem' }}>Loading settings…</div>

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>AI Behavior Settings</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Adjust forecast sensitivity, budget limits, and vendor evaluation weights.
      </p>
      <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Forecast sensitivity (0.5–2.0)</span>
          <input
            type="number"
            min={0.5}
            max={2}
            step={0.1}
            value={form.forecast_sensitivity}
            onChange={(e) => setForm((f) => ({ ...f, forecast_sensitivity: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Budget limit (USD, 0 = no limit)</span>
          <input
            type="number"
            min={0}
            value={form.budget_limit_usd}
            onChange={(e) => setForm((f) => ({ ...f, budget_limit_usd: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Vendor weight: Price (0–1)</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={form.vendor_weight_price}
            onChange={(e) => setForm((f) => ({ ...f, vendor_weight_price: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Vendor weight: Delivery (0–1)</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={form.vendor_weight_delivery}
            onChange={(e) => setForm((f) => ({ ...f, vendor_weight_delivery: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Vendor weight: Reliability (0–1)</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={form.vendor_weight_reliability}
            onChange={(e) => setForm((f) => ({ ...f, vendor_weight_reliability: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Low stock threshold % (vs reorder point)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.low_stock_threshold_pct}
            onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold_pct: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <button onClick={save} disabled={saving} style={btnPrimary}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  color: 'var(--text)',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.6rem 1rem',
  marginTop: '0.5rem',
}
