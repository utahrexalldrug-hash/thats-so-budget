import { useState, useRef } from 'react'
import { useStore, store } from '../lib/store'
import { formatCurrency, PAYMENT_METHODS, CATEGORY_ICONS } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, ArrowLeft, Check, Loader2, ShoppingBag, Split, Pencil, Trash2, Plus } from 'lucide-react'
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
  const [editingItem, setEditingItem] = useState(null)

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

    const apiKey = data.apiKey || localStorage.getItem('tsb_anthropic_key')
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

  const updateItem = (idx, field, value) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
    // Recalculate total when prices change
    if (field === 'price') {
      setTotal(updated.reduce((s, i) => s + (parseFloat(i.price) || 0), 0))
    }
  }

  const deleteItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx)
    setItems(updated)
    setTotal(updated.reduce((s, i) => s + (parseFloat(i.price) || 0), 0))
  }

  const addItem = () => {
    const newItem = { id: Date.now(), name: '', price: 0, envelopeId: 'food' }
    setItems([...items, newItem])
    setEditingItem(items.length)
  }

  const saveAll = () => {
    if (mode === 'whole') {
      store.addTransaction({
        description: storeName || 'Receipt',
        amount: parseFloat(total) || 0,
        envelopeId: wholeEnvelope,
        paymentMethod,
        monthKey: data.currentMonth,
        date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
        type: 'expense',
      })
    } else {
      const receiptGroup = crypto.randomUUID()
      const receiptTotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)
      const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
      items.forEach(item => {
        if (item.price > 0) {
          store.addTransaction({
            description: `${storeName} - ${item.name || 'Item'}`,
            amount: parseFloat(item.price) || 0,
            envelopeId: item.envelopeId,
            paymentMethod,
            monthKey: today.slice(0, 7),
            date: today,
            type: 'expense',
            receiptGroup,
            receiptTotal,
            receiptStore: storeName || 'Receipt',
          })
        }
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
        /* Results — fully editable */
        <div className="px-6 space-y-5">
          {/* Store name & total — editable */}
          <div className="bg-white rounded-2xl border border-border-light p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={16} className="text-text-tertiary" />
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Store & Total</span>
            </div>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-semibold"
              placeholder="Store name"
            />
            {mode === 'whole' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={total}
                  onChange={e => setTotal(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-semibold"
                  placeholder="Total"
                />
              </div>
            )}
            {mode === 'split' && (
              <p className="text-sm font-semibold text-right tabular-nums">Total: {formatCurrency(items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0))}</p>
            )}
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
              <label className="text-sm font-medium text-text-secondary block mb-2">Assign to category</label>
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Items — tap to edit</span>
                <button onClick={addItem} className="text-accent text-sm font-medium flex items-center gap-1">
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  className="bg-white rounded-xl border border-border-light p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  {/* Item name — editable */}
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-medium"
                      placeholder="Item name"
                    />
                    {/* Item price — editable */}
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-semibold tabular-nums text-right"
                      />
                    </div>
                    <button
                      onClick={() => deleteItem(idx)}
                      className="p-1.5 rounded-lg text-text-tertiary hover:text-danger active:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Category — editable */}
                  <select
                    value={item.envelopeId}
                    onChange={e => updateItem(idx, 'envelopeId', e.target.value)}
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

          {/* Start over */}
          <button
            onClick={() => { setItems(null); setImagePreview(null); setImage(null); setStoreName(''); setTotal(0); setError(null) }}
            className="w-full py-3 text-sm font-medium text-text-secondary"
          >
            Scan a different receipt
          </button>
        </div>
      )}
    </div>
  )
}
