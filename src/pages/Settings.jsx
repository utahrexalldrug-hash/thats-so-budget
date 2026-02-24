import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Key, Check, Trash2, Database } from 'lucide-react'
import { store } from '../lib/store'

export default function Settings() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(localStorage.getItem('tsb_anthropic_key') || '')
  const [saved, setSaved] = useState(false)

  const saveKey = () => {
    localStorage.setItem('tsb_anthropic_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            Your key is stored locally on this device only. Get one at{' '}
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
          That's So Budget v1.0<br />
          Made with love for S & K
        </p>
      </div>
    </div>
  )
}
