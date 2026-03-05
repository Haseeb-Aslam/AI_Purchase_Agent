import { useState } from 'react'
import { api } from '../api/client'

export default function RFQDraft() {
  const [productName, setProductName] = useState('')
  const [skuId, setSkuId] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [tone, setTone] = useState('professional')
  const [strategy, setStrategy] = useState('standard')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!productName.trim()) return
    setLoading(true)
    setDraft('')
    try {
      const res = await api.rfqDraft({
        product_name: productName,
        quantity,
        tone,
        negotiation_strategy: strategy,
        sku_id: skuId || undefined,
      })
      setDraft(res.draft)
    } catch (e) {
      setDraft(`Error: ${e instanceof Error ? e.message : 'Failed'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>RFQ Draft</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Generate AI request-for-quotation message for suppliers.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '560px' }}>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Product name</span>
          <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Wireless Earbuds" style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>SKU (optional)</span>
          <input value={skuId} onChange={(e) => setSkuId(e.target.value)} placeholder="e.g. SKU-1000" style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Quantity</span>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 0)} style={inputStyle} />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Tone</span>
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={inputStyle}>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Negotiation</span>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={inputStyle}>
            <option value="standard">Standard</option>
            <option value="aggressive">Aggressive</option>
            <option value="collaborative">Collaborative</option>
          </select>
        </label>
        <button onClick={generate} disabled={loading || !productName.trim()} style={btnPrimary}>
          {loading ? 'Generating…' : 'Generate RFQ'}
        </button>
      </div>
      {draft && (
        <div style={{ marginTop: '1.5rem', maxWidth: '640px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Draft</h3>
          <pre style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
            {draft}
          </pre>
        </div>
      )}
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
  padding: '0.5rem 1rem',
}
