import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { api, Overview, CostBreakdown } from '../api/client'

const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#a371f7']

export default function Dashboard() {
  const [period, setPeriod] = useState('2026-03')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [trends, setTrends] = useState<{ period: string; value_usd: number }[]>([])
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [aiPerf, setAiPerf] = useState<{ forecast_accuracy_avg_pct?: number; cost_savings_usd: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [ov, tr, cost, ai] = await Promise.all([
          api.overview(period),
          api.purchaseTrends({ granularity: 'monthly', start_date: '2025-01-01', end_date: '2026-12-31' }),
          api.costBreakdown(period),
          api.aiAgentPerformance(period),
        ])
        if (!cancelled) {
          setOverview(ov)
          setTrends(tr.data || [])
          setCostBreakdown(cost)
          setAiPerf(ai)
        }
      } catch (e) {
        if (!cancelled) setOverview(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [period])

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    try {
      const r = await api.exportReport(period, format)
      if (format === 'csv' && 'csv' in r && r.csv) {
        const blob = new Blob([r.csv], { type: 'text/csv' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = r.filename || 'report.csv'
        a.click()
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `report_${period}.json`
        a.click()
      }
    } finally {
      setExporting(false)
    }
  }

  const pieData = costBreakdown?.top_cost_skus?.slice(0, 5).map((s, i) => ({
    name: s.sku_id,
    value: s.total_usd,
    fill: COLORS[i % COLORS.length],
  })) || []

  if (loading && !overview) {
    return <div style={{ padding: '2rem' }}>Loading dashboard…</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Procurement Analytics</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Period</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.4rem 0.6rem',
              color: 'var(--text)',
            }}
          />
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            style={btnSecondary}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            style={btnSecondary}
          >
            Export JSON
          </button>
        </div>
      </div>

      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Card title="Total Purchase Value" value={`$${overview.total_purchase_value_usd?.toLocaleString() ?? 0}`} />
          <Card title="Orders Placed" value={String(overview.orders_placed ?? 0)} />
          <Card title="Avg Purchase Cost" value={`$${overview.average_purchase_cost_usd?.toFixed(2) ?? 0}`} />
          <Card title="Budget Utilization" value={`${overview.budget_utilization_pct?.toFixed(1) ?? 0}%`} />
          {aiPerf && (
            <>
              <Card title="AI Cost Savings" value={`$${aiPerf.cost_savings_usd?.toLocaleString() ?? 0}`} />
              <Card title="Forecast Accuracy" value={aiPerf.forecast_accuracy_avg_pct != null ? `${aiPerf.forecast_accuracy_avg_pct.toFixed(1)}%` : '—'} />
            </>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 1rem' }}>Purchase Trends (Monthly)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} />
              <Line type="monotone" dataKey="value_usd" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 1rem' }}>Top Cost SKUs</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieData[i].fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Spend']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No data for this period.</p>
          )}
        </div>
      </div>

      {costBreakdown?.by_category && Object.keys(costBreakdown.by_category).length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 1rem' }}>Spend by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(costBreakdown.by_category).map(([name, v]) => ({
                name,
                budget: (v as { budget_usd?: number }).budget_usd ?? 0,
                actual: (v as { actual_usd?: number }).actual_usd ?? 0,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
              <Bar dataKey="budget" fill="var(--text-muted)" radius={[4, 4, 0, 0]} name="Budget" />
              <Bar dataKey="actual" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1rem',
}

const btnSecondary: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
}
