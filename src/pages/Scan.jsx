import { useState, useRef } from 'react'
import { useStore, store } from '../lib/store'
import { formatCurrency, PAYMENT_METHODS, CATEGORY_ICONS } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, ArrowLeft, Check, Loader2, ShoppingBag, Split, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Scan() {
  const data = useStore()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState(null)
  const [storeName, setStoreName] = useState('')
  const [total, setTotal] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('scc')
  const [mode, setMode] = useState('whole')
  const [wholeEnvelope, setWholeEnvelope] = useState('food')
  const [error, setError] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleCapture = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const processReceipt = async () => {
    if (!image) return
    setLoading(true)
    setError(null)

    const apiKey = localStorage.getItem('tsb_anthropic_key')
    if (!apiKey) {
      setError('No API key found. Go to Settings to add your Anthropic API key.')
      setLoading(false)
      return
    }

    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(image)
      })

      const mediaType = image.type || 'image/jpeg'
      const envelopeNames = data.envelopes.map(e => e.name).join(', ')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: `Read this receipt and extract structured data. My budget categories are: ${envelopeNames}.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "store": "Store Name",
  "total": 123.45,
  "items": [
    {"name": "Item name", "price": 12.99, "suggestedCategory": "Food / Toiletries"},
    {"name": "Item name", "price": 5.49, "suggestedCategory": "Cleaning"}
  ]
}

Match each item to the closest category from my list. If unsure, use "Food / Toiletries" as default.` }
            ]
          }]
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'API request failed')
      }

      const result = await response.json()
      const text = result.content[0].text.trim()
      const parsed = JSON.parse(text)

      setStoreName(parsed.store || 'Unknown Store')
      setTotal(parsed.total || 0)
      setItems(parsed.items.map((item, i) => ({
        ...item,
        id: i,
        envelopeId: data.envelopes.find(e => e.name === item.suggestedCategory)?.id || 'food',
      })))
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to process receipt. Try again or add manually.')
    }
    setLoading(false)
  }

  const saveAll = () => {
    if (mode === 'whole') {
      store.addTransaction({
        description: storeName || 'Receipt',
        amount: total,
        envelopeId: wholeEnvelope,
        paymentMethod,
        monthKey: data.currentMonth,
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
      })
    } else {
      items.forEach(item => {
        store.addTransaction({
          description: `${storeName} - ${item.name}`,
          amount: item.price,
          envelopeId: item.envelopeId,
          paymentMethod,
          monthKey: data.currentMonth,
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
        })
      })
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-accent text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold">Scan Receipt</h1>
        <p className="text-sm text-text-secondary mt-1">Take a photo or upload a screenshot</p>
      </div>

      {!items ? (
        <div className="px-6">
          {/* Camera / Upload */}
          {!imagePreview ? (
            <div className="space-y-3">
              <button
                onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}
                className="w-full py-16 rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-3 active:bg-surface-2 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center">
                  <Camera size={28} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Take Photo</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Point at a receipt</p>
                </div>
              </button>

              <button
                onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}
                className="w-full py-6 rounded-2xl border border-border-light bg-white flex items-center justify-center gap-3 active:bg-surface-2 transition-colors"
              >
                <Upload size={18} className="text-text-secondary" />
                <span className="font-medium text-sm">Upload Screenshot</span>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleCapture}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden">
                <img src={imagePreview} alt="Receipt" className="w-full max-h-64 object-cover rounded-2xl" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setImagePreview(null); setImage(null); setError(null) }}
                  className="flex-1 py-3.5 rounded-xl border border-border text-sm font-medium"
                >
                  Retake
                </button>
                <button
                  onClick={processReceipt}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-accent text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Reading...</> : 'Read Receipt'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div className="px-6 space-y-5">
          <div className="bg-white rounded-2xl border border-border-light p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-text-secondary" />
                <span className="font-semibold">{storeName}</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">{items.length} items detected</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-surface-2 rounded-xl p-1">
            <button
              onClick={() => setMode('whole')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                mode === 'whole' ? 'bg-white shadow-sm' : 'text-text-tertiary'
              }`}
            >
              <ShoppingBag size={14} /> Whole Receipt
            </button>
            <button
              onClick={() => setMode('split')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                mode === 'split' ? 'bg-white shadow-sm' : 'text-text-tertiary'
              }`}
            >
              <Split size={14} /> Split Items
            </button>
          </div>

          {mode === 'whole' ? (
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Assign to envelope</label>
              <div className="grid grid-cols-2 gap-2">
                {data.envelopes.map(env => {
                  const icon = CATEGORY_ICONS[env.icon] || '📁'
                  return (
                    <button
                      key={env.id}
                      onClick={() => setWholeEnvelope(env.id)}
                      className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
                        wholeEnvelope === env.id ? 'border-accent bg-accent-light' : 'border-border-light bg-white'
                      }`}
                    >
                      <span>{icon}</span>
                      <span className="text-sm font-medium truncate">{env.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  className="bg-white rounded-xl border border-border-light p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.price)}</span>
                  </div>
                  <select
                    value={item.envelopeId}
                    onChange={e => {
                      const updated = [...items]
                      updated[idx] = { ...item, envelopeId: e.target.value }
                      setItems(updated)
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-light text-sm"
                  >
                    {data.envelopes.map(env => (
                      <option key={env.id} value={env.id}>{CATEGORY_ICONS[env.icon] || '📁'} {env.name}</option>
                    ))}
                  </select>
                </motion.div>
              ))}
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Paid with</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    paymentMethod === pm.id ? 'border-accent bg-accent-light text-accent' : 'border-border-light text-text-secondary'
                  }`}
                >
                  {pm.short}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <motion.button
            onClick={saveAll}
            className="w-full py-4 bg-accent text-white font-semibold rounded-xl text-lg active:bg-accent-dark transition-colors flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            <Check size={20} /> Save {mode === 'split' ? `${items.length} Items` : 'Receipt'}
          </motion.button>
        </div>
      )}
    </div>
  )
}
