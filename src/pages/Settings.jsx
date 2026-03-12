import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Key, Check, Trash2, Database, LogOut, User, Wifi, WifiOff } from 'lucide-react'
import { useStore, store } from '../lib/store'
import { auth, logout } from '../lib/firebase'

export default function Settings() {
  const data = useStore()
  const navigate = useNavigate()
  // Load from store (synced) first, fall back to localStorage (legacy)
  const [apiKey, setApiKey] = useState(data.apiKey || localStorage.getItem('tsb_anthropic_key') || '')
  const [saved, setSaved] = useState(false)
  const user = auth.currentUser
  const isOnline = store.isOnline()

  const saveKey = () => {
    // Save to both store (syncs via Firestore) and localStorage (offline fallback)
    store.update(() => ({ apiKey }))
    localStorage.setItem('tsb_anthropic_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-accent text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Account */}
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <User size={18} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Account</h3>
              <p className="text-xs text-text-tertiary truncate">{user?.email || 'Not signed in'}</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {isOnline ? (
                <><Wifi size={12} className="text-green-500" /><span className="text-green-600 font-medium">Synced</span></>
              ) : (
                <><WifiOff size={12} className="text-text-tertiary" /><span className="text-text-tertiary">Local only</span></>
              )}
            </div>
          </div>
          {isOnline && (
            <p className="text-xs text-text-tertiary mb-3">
              Your data syncs in real-time. Have your partner sign up with their own email — then share the same household by signing in on their phone.
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-border-light text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Key size={18} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold">Claude API Key</h3>
              <p className="text-xs text-text-tertiary">Powers smart receipt scanning</p>
            </div>
          </div>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-mono"
          />
          <button
            onClick={saveKey}
            className="mt-3 w-full py-3 bg-accent text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:bg-accent-dark transition-colors"
          >
            {saved ? <><Check size={16} /> Saved!</> : 'Save API Key'}
          </button>
          <p className="text-xs text-text-tertiary mt-3 leading-relaxed">
            Your key syncs across all your devices. Enter it once and you're set. Get one at{' '}
            <a href="https://console.anthropic.com" target="_blank" className="text-accent underline">console.anthropic.com</a>
          </p>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Database size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Data</h3>
              <p className="text-xs text-text-tertiary">Manage your budget data</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('This will reset ALL your budget data. Are you sure?')) {
                store.resetData()
                navigate('/')
              }
            }}
            className="w-full py-3 rounded-xl border-2 border-danger/20 text-danger font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Reset All Data
          </button>
        </div>

        <p className="text-center text-xs text-text-tertiary pt-4">
          That's So Budget v1.1<br />
          Made with love for S & K
        </p>
      </div>
    </div>
  )
}
