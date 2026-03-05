import { useState, useEffect } from 'react'
import { api, SupplierRec } from '../api/client'

export default function Suppliers() {
  const [skuId, setSkuId] = useState('')
  const [category, setCategory] = useState('')
  const [suppliers, setSuppliers] = useState<SupplierRec[]>([])
  const [loading, setLoading] = useState(false)

  const search = () => {
    setLoading(true)
    api.recommendSuppliers(skuId || undefined, category || undefined, 20)
      .then((r) => setSuppliers(r.suppliers || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    search()
  }, [])

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Supplier Recommendations</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Compare vendors by price, delivery, and reliability. Filter by SKU or category.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="SKU (e.g. SKU-1000)"
          value={skuId}
          onChange={(e) => setSkuId(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Category (e.g. Electronics)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        />
        <button onClick={search} disabled={loading} style={btnPrimary}>
          {loading ? 'Loading…' : 'Search'}
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Supplier</th>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Unit Price</th>
              <th style={thStyle}>Lead Time (days)</th>
              <th style={thStyle}>Reliability</th>
              <th style={thStyle}>On-time %</th>
              <th style={thStyle}>Score</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.supplier_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{s.rank ?? '—'}</td>
                <td style={tdStyle}>{s.supplier_name}</td>
                <td style={tdStyle}>{s.supplier_id}</td>
                <td style={tdStyle}>{s.unit_price != null ? `$${s.unit_price.toFixed(2)}` : '—'}</td>
                <td style={tdStyle}>{s.lead_time_days ?? '—'}</td>
                <td style={tdStyle}>{s.reliability_score != null ? `${s.reliability_score.toFixed(1)}` : '—'}</td>
                <td style={tdStyle}>{s.ontime_delivery_rate_pct != null ? `${s.ontime_delivery_rate_pct}%` : '—'}</td>
                <td style={tdStyle}>{s.composite_score != null ? s.composite_score.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  color: 'var(--text)',
  minWidth: 160,
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
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
