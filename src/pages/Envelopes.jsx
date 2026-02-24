import { useState } from 'react'
import { useStore, useEnvelopeSpent, store } from '../lib/store'
import { formatCurrency, getMonthName, CATEGORY_ICONS, PAYMENT_METHODS } from '../lib/utils'
import EnvelopeCard from '../components/EnvelopeCard'
import Modal from '../components/Modal'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, ArrowLeft, Trash2, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Envelopes() {
  const data = useStore()
  const navigate = useNavigate()
  const totalBudget = data.envelopes.reduce((s, e) => s + e.budget, 0)

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Envelopes</h1>
        <p className="text-sm text-text-secondary mt-1">
          {getMonthName(data.currentMonth)} &middot; {formatCurrency(totalBudget)} budgeted
        </p>
      </div>

      <div className="px-5 space-y-3">
        {data.envelopes.map((env, i) => (
          <motion.div
            key={env.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <EnvelopeCard envelope={env} onClick={() => navigate(`/envelopes/${env.id}`)} />
          </motion.div>
        ))}
      </div>

      <div className="px-5 mt-4">
        <button
          onClick={() => navigate('/envelopes/new')}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={18} /> Add Envelope
        </button>
      </div>
    </div>
  )
}

export function EnvelopeDetail() {
  const { id } = useParams()
  const data = useStore()
  const navigate = useNavigate()
  const envelope = data.envelopes.find(e => e.id === id)
  const spent = useEnvelopeSpent(id)
  const transactions = data.transactions
    .filter(t => t.envelopeId === id && t.monthKey === data.currentMonth)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const [expandedTx, setExpandedTx] = useState(null)
  const [editingTx, setEditingTx] = useState(null)
  const [editForm, setEditForm] = useState({})

  if (!envelope) return <div className="pt-20 text-center text-text-secondary">Envelope not found</div>

  const remaining = envelope.budget - spent
  const pct = envelope.budget > 0 ? Math.min(spent / envelope.budget, 1) : 0
  const icon = CATEGORY_ICONS[envelope.icon] || '📁'

  const startEdit = (tx) => {
    setEditForm({ description: tx.description, amount: String(tx.amount), paymentMethod: tx.paymentMethod || 'scc', note: tx.note || '' })
    setEditingTx(tx.id)
    setExpandedTx(null)
  }

  const saveEdit = () => {
    if (!editForm.description || !editForm.amount) return
    store.updateTransaction(editingTx, {
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      paymentMethod: editForm.paymentMethod,
      note: editForm.note,
    })
    setEditingTx(null)
  }

  const deleteTx = (txId) => {
    store.deleteTransaction(txId)
    setExpandedTx(null)
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-6">
        <button onClick={() => navigate('/envelopes')} className="flex items-center gap-1 text-accent text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Envelopes
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h1 className="text-xl font-bold">{envelope.name}</h1>
            <p className="text-sm text-text-secondary">{getMonthName(data.currentMonth)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-light p-5">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Remaining</p>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-danger' : ''}`}>{formatCurrency(remaining)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Budget</p>
              <p className="text-2xl font-bold text-text-secondary">{formatCurrency(envelope.budget)}</p>
            </div>
          </div>
          <div className="relative h-3 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: envelope.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2 text-center">{formatCurrency(spent)} of {formatCurrency(envelope.budget)} spent ({Math.round(pct * 100)}%)</p>
        </div>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Transactions</h3>
          <button
            onClick={() => navigate('/add?envelope=' + id)}
            className="text-sm font-medium text-accent flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Scan a receipt or add one manually</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map(tx => (
              <div key={tx.id}>
                <button
                  onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                  className="w-full flex items-center justify-between py-3 border-b border-border-light last:border-0 text-left active:bg-surface-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-[15px] font-medium">{tx.description}</p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {tx.paymentMethod && ` \u00b7 ${tx.paymentMethod.toUpperCase()}`}
                      {tx.note && ` \u00b7 ${tx.note}`}
                    </p>
                  </div>
                  <span className={`font-semibold text-[15px] tabular-nums ${tx.type === 'refund' ? 'text-success' : ''}`}>
                    {tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </button>

                <AnimatePresence>
                  {expandedTx === tx.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 pb-3 pl-1">
                        <button
                          onClick={() => startEdit(tx)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-2 text-sm font-medium text-text-secondary active:bg-surface-3 transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteTx(tx.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-sm font-medium text-danger active:bg-red-100 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={!!editingTx} onClose={() => setEditingTx(null)} title="Edit Transaction">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Description</label>
            <input
              type="text"
              value={editForm.description || ''}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                step="0.01"
                value={editForm.amount || ''}
                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setEditForm(f => ({ ...f, paymentMethod: pm.id }))}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    editForm.paymentMethod === pm.id ? 'border-accent bg-accent-light text-accent' : 'border-border-light text-text-secondary'
                  }`}
                >
                  {pm.short}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Note</label>
            <input
              type="text"
              value={editForm.note || ''}
              onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Optional note"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>
          <button
            onClick={saveEdit}
            className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors"
          >
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  )
}
