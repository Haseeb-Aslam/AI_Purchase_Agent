import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AgentChat from './pages/AgentChat'
import ReorderAlerts from './pages/ReorderAlerts'
import Suppliers from './pages/Suppliers'
import PODraft from './pages/PODraft'
import RFQDraft from './pages/RFQDraft'
import Settings from './pages/Settings'
import DataImport from './pages/DataImport'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agent" element={<AgentChat />} />
        <Route path="/reorder" element={<ReorderAlerts />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/po-draft" element={<PODraft />} />
        <Route path="/rfq-draft" element={<RFQDraft />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/import" element={<DataImport />} />
      </Routes>
    </Layout>
  )
}

export default App
