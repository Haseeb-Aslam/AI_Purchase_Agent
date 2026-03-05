import { useState } from 'react'
import { api } from '../api/client'

type LineItem = { product_name: string; qty: number; unit_price_usd: number }

export default function PODraft() {
  const [supplierName, setSupplierName] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ product_name: '', qty: 0, unit_price_usd: 0 }])
  const [draft, setDraft] = useState<{ draft_text: string; total_usd: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const addLine = () => setItems((i) => [...i, { product_name: '', qty: 0, unit_price_usd: 0 }])
  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems((i) => i.map((line, n) => (n === idx ? { ...line, [field]: value } : line)))
  }
  const removeLine = (idx: number) => setItems((i) => i.filter((_, n) => n !== idx))

  const generateDraft = async () => {
    const valid = items.filter((i) => i.product_name && i.qty > 0 && i.unit_price_usd >= 0)
    if (!supplierName.trim() || valid.length === 0) return
    setLoading(true)
    setDraft(null)
    try {
      const body = {
        items: valid.map((i) => ({ product_name: i.product_name, qty: i.qty, unit_price_usd: i.unit_price_usd })),
        supplier_id: supplierId || 'TBD',
        supplier_name: supplierName,
        notes: notes || undefined,
      }
      const res = await api.poDraft(body)
      setDraft(res)
    } catch (e) {
      setDraft({ draft_text: `Error: ${e instanceof Error ? e.message : 'Failed'}`, total_usd: 0 })
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = () => {
    const valid = items.filter((i) => i.product_name && i.qty > 0 && i.unit_price_usd >= 0)
    if (!supplierName || valid.length === 0) return
    const url = api.poDraftPdfUrl(supplierName, valid)
    window.open(url, '_blank')
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Purchase Order Draft</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Add line items and supplier to generate a PO draft and export PDF.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Supplier name</span>
          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. GlobalTech Supplies"
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Supplier ID (optional)</span>
          <input
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            placeholder="e.g. SUP-101"
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Notes (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={inputStyle}
          />
        </label>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem' }}>Line items</span>
            <button type="button" onClick={addLine} style={btnSecondary}>+ Add line</button>
          </div>
          {items.map((line, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input
                value={line.product_name}
                onChange={(e) => updateLine(idx, 'product_name', e.target.value)}
                placeholder="Product name"
                style={inputStyle}
              />
              <input
                type="number"
                min={0}
                value={line.qty || ''}
                onChange={(e) => updateLine(idx, 'qty', Number(e.target.value) || 0)}
                placeholder="Qty"
                style={inputStyle}
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={line.unit_price_usd || ''}
                onChange={(e) => updateLine(idx, 'unit_price_usd', Number(e.target.value) || 0)}
                placeholder="Unit $"
                style={inputStyle}
              />
              <button type="button" onClick={() => removeLine(idx)} style={{ ...btnSecondary, padding: '0.35rem' }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={generateDraft} disabled={loading} style={btnPrimary}>
            {loading ? 'Generating…' : 'Generate draft'}
          </button>
          <button onClick={downloadPdf} style={btnSecondary}>Download PDF</button>
        </div>
      </div>
      {draft && (
        <div style={{ marginTop: '1.5rem', maxWidth: '640px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Draft summary</h3>
          <pre style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
            {draft.draft_text}
          </pre>
          <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Total: ${draft.total_usd.toFixed(2)}</p>
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

const btnSecondary: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
}
