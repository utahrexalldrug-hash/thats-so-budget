import { useState } from 'react'
import { useStore, store } from '../lib/store'
import { formatCurrency, PAYMENT_METHODS, CATEGORY_ICONS } from '../lib/utils'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AddTransaction() {
  const data = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedEnvelope = searchParams.get('envelope') || ''

  const [form, setForm] = useState({
    description: '',
    amount: '',
    envelopeId: preselectedEnvelope,
    paymentMethod: 'scc',
    note: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.description || !form.amount || !form.envelopeId) return
    store.addTransaction({
      description: form.description,
      amount: parseFloat(form.amount),
      envelopeId: form.envelopeId,
      paymentMethod: form.paymentMethod,
      note: form.note,
      type: form.type,
      monthKey: data.currentMonth,
      date: form.date,
    })
    navigate(-1)
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-accent text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold">Add Transaction</h1>
      </div>

      <form onSubmit={submit} className="px-6 space-y-5">
        {/* Type Toggle */}
        <div className="flex bg-surface-2 rounded-xl p-1">
          {['expense', 'refund'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => update('type', type)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                form.type === type
                  ? type === 'expense' ? 'bg-white shadow-sm text-text' : 'bg-white shadow-sm text-success'
                  : 'text-text-tertiary'
              }`}
            >
              {type === 'refund' && <RefreshCw size={14} />}
              {type === 'expense' ? 'Expense' : 'Refund'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-text-tertiary font-light">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              className="w-full pl-10 pr-4 py-4 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none text-2xl font-semibold transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Description</label>
          <input
            type="text"
            placeholder="e.g. Costco groceries"
            value={form.description}
            onChange={e => update('description', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
          />
        </div>

        {/* Envelope */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">Envelope</label>
          <div className="grid grid-cols-2 gap-2">
            {data.envelopes.map(env => {
              const icon = CATEGORY_ICONS[env.icon] || '📁'
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => update('envelopeId', env.id)}
                  className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
                    form.envelopeId === env.id
                      ? 'border-accent bg-accent-light'
                      : 'border-border-light bg-white'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-sm font-medium truncate">{env.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">Payment Method</label>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => update('paymentMethod', pm.id)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.paymentMethod === pm.id
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border-light text-text-secondary'
                }`}
              >
                {pm.short}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Note (optional)</label>
          <input
            type="text"
            placeholder="e.g. Birthday gift for Mom"
            value={form.note}
            onChange={e => update('note', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => update('date', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
          />
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          className="w-full py-4 bg-accent text-white font-semibold rounded-xl text-lg active:bg-accent-dark transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          {form.type === 'refund' ? 'Add Refund' : 'Add Expense'}
        </motion.button>
      </form>
    </div>
  )
}
