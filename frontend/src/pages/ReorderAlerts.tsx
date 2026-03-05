import { useState, useEffect } from 'react'
import { api, ReorderAlert } from '../api/client'

export default function ReorderAlerts() {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.reorderAlerts()
      .then((r) => setAlerts(r.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '1rem' }}>Loading reorder alerts…</div>

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Reorder & Low Stock Alerts</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Items at or below reorder point with recommended order quantities.
      </p>
      {alerts.length === 0 ? (
        <div style={cardStyle}>No low-stock alerts at the moment.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Current</th>
                <th style={thStyle}>Reorder Point</th>
                <th style={thStyle}>Safety Stock</th>
                <th style={thStyle}>Recommended Qty</th>
                <th style={thStyle}>Days of Supply</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.sku_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>{a.sku_id}</td>
                  <td style={tdStyle}>{a.product_name}</td>
                  <td style={tdStyle}>{a.category}</td>
                  <td style={tdStyle}>{a.current_stock}</td>
                  <td style={tdStyle}>{a.reorder_point}</td>
                  <td style={tdStyle}>{a.safety_stock}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{a.recommended_reorder_qty}</td>
                  <td style={tdStyle}>{a.days_of_supply != null ? a.days_of_supply.toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '2rem',
  color: 'var(--text-muted)',
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
}
