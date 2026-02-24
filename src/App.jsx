import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Envelopes, { EnvelopeDetail } from './pages/Envelopes'
import Bills from './pages/Bills'
import Scan from './pages/Scan'
import Trends from './pages/Trends'
import AddTransaction from './pages/AddTransaction'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="max-w-lg mx-auto bg-surface min-h-screen relative">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/envelopes" element={<Envelopes />} />
        <Route path="/envelopes/:id" element={<EnvelopeDetail />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
