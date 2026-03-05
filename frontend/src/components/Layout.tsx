import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Package, Users, FileText, Mail, Settings, Upload } from 'lucide-react'

export default function Layout({ children }: { children: ReactNode }) {
  const nav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/agent', icon: MessageSquare, label: 'AI Agent' },
    { to: '/reorder', icon: Package, label: 'Reorder Alerts' },
    { to: '/suppliers', icon: Users, label: 'Suppliers' },
    { to: '/po-draft', icon: FileText, label: 'PO Draft' },
    { to: '/rfq-draft', icon: Mail, label: 'RFQ Draft' },
    { to: '/settings', icon: Settings, label: 'AI Settings' },
    { to: '/import', icon: Upload, label: 'Import Data' },
  ]
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={sidebar}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Procurement</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Purchase Agent</p>
        </div>
        <nav style={{ padding: '0.75rem' }}>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({ ...navLink, ...(isActive ? navLinkActive : {}) })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={main}>
        {children}
      </main>
    </div>
  )
}

const sidebar: React.CSSProperties = {
  width: '220px',
  background: 'var(--bg-card)',
  borderRight: '1px solid var(--border)',
}

const navLink: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  textDecoration: 'none',
  marginBottom: '2px',
  fontSize: '0.9rem',
}

const navLinkActive: React.CSSProperties = {
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
}

const main: React.CSSProperties = {
  flex: 1,
  padding: '1.5rem 2rem',
  overflow: 'auto',
}
