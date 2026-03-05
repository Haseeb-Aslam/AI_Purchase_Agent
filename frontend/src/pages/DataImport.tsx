import { useState } from 'react'
import { api } from '../api/client'

export default function DataImport() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, number | string> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runImport = () => {
    setLoading(true)
    setResult(null)
    setError(null)
    api.importAll()
      .then((r) => setResult(r.imported))
      .catch((e) => setError(e instanceof Error ? e.message : 'Import failed'))
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Import Data</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Load CSV/Excel files from the project data directory into MongoDB. Run this after starting the backend and MongoDB.
      </p>
      <button onClick={runImport} disabled={loading} style={btnPrimary}>
        {loading ? 'Importing…' : 'Import All'}
      </button>
      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(248,81,73,0.15)', borderRadius: '8px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Imported counts</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {Object.entries(result).map(([name, count]) => (
              <li key={name}>
                <strong>{name}</strong>: {typeof count === 'number' ? count : String(count)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.6rem 1rem',
}
