import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { onAuth } from './lib/firebase'
import { store } from './lib/store'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Categories, { CategoryDetail } from './pages/Categories'
import Bills from './pages/Bills'
import Scan from './pages/Scan'
import Trends from './pages/Trends'
import Activity from './pages/Activity'
import AddTransaction from './pages/AddTransaction'
import Debts from './pages/Debts'
import Settings from './pages/Settings'
import Login from './pages/Login'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = not logged in

  useEffect(() => {
    const unsub = onAuth((firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        store.onLogin(firebaseUser.uid)
      } else {
        store.onLogout()
      }
    })
    return unsub
  }, [])

  // Loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f7b6c] to-[#0a5c51] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Login />
  }

  // Logged in
  return (
    <div className="max-w-lg mx-auto bg-surface min-h-screen relative">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryDetail />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/debts" element={<Debts />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
