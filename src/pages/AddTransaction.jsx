import { useState, useMemo } from 'react'
import { useStore, store } from '../lib/store'
import { formatCurrency, PAYMENT_METHODS, CATEGORY_ICONS } from '../lib/utils'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, RefreshCw, DollarSign, Search, Link2, X, Split, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddTransaction() {
  const data = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedEnvelope = searchParams.get('envelope') || ''
  const startTab = searchParams.get('tab') || 'expense'

  const [form, setForm] = useState({
    description: '',
    amount: '',
    envelopeId: preselectedEnvelope,
    paymentMethod: 'scc',
    note: '',
    type: startTab,
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
    incomeSource: '',
    linkedTxId: '',
  })

  // Split expense state
  const [isSplit, setIsSplit] = useState(false)
  const [splits, setSplits] = useState([
    { envelopeId: preselectedEnvelope || '', amount: '' },
  ])

  const addSplitRow = () => setSplits(s => [...s, { envelopeId: '', amount: '' }])
  const removeSplitRow = (idx) => setSplits(s => s.filter((_, i) => i !== idx))
  const updateSplit = (idx, field, value) => setSplits(s => s.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  const splitTotal = splits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const splitRemaining = (parseFloat(form.amount) || 0) - splitTotal

  // Refund search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDateFrom, setSearchDateFrom] = useState('')
  const [searchDateTo, setSearchDateTo] = useState('')

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Filter transactions for refund linking
  const searchResults = useMemo(() => {
    if (!showSearch) return []
    let txs = data.transactions.filter(t => t.type === 'expense')

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      txs = txs.filter(t => t.description.toLowerCase().includes(q))
    }

    if (searchDateFrom) {
      txs = txs.filter(t => (t.date || t.createdAt?.split('T')[0]) >= searchDateFrom)
    }
    if (searchDateTo) {
      txs = txs.filter(t => (t.date || t.createdAt?.split('T')[0]) <= searchDateTo)
    }

    return txs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20)
  }, [showSearch, searchQuery, searchDateFrom, searchDateTo, data.transactions])

  const linkedTx = form.linkedTxId ? data.transactions.find(t => t.id === form.linkedTxId) : null

  const selectLinkedTx = (tx) => {
    setForm(f => ({
      ...f,
      linkedTxId: tx.id,
      description: tx.description + ' (refund)',
      envelopeId: tx.envelopeId,
      paymentMethod: tx.paymentMethod || 'scc',
    }))
    setShowSearch(false)
  }

  const clearLinkedTx = () => {
    setForm(f => ({ ...f, linkedTxId: '' }))
  }

  const submit = (e) => {
    e.preventDefault()

    // Derive monthKey from the transaction date so it always matches
    const monthKey = form.date ? form.date.slice(0, 7) : data.currentMonth

    if (form.type === 'income') {
      if (!form.incomeSource || !form.amount) return
      store.addIncome({
        source: form.incomeSource,
        amount: parseFloat(form.amount),
        monthKey,
      })
      navigate(-1)
      return
    }

    if (!form.description || !form.amount) return

    if (isSplit && form.type === 'expense') {
      // Save as grouped split transactions
      const validSplits = splits.filter(s => s.envelopeId && parseFloat(s.amount) > 0)
      if (validSplits.length === 0) return
      const receiptGroup = crypto.randomUUID()
      const receiptTotal = parseFloat(form.amount)
      validSplits.forEach(s => {
        store.addTransaction({
          description: form.description,
          amount: parseFloat(s.amount),
          envelopeId: s.envelopeId,
          paymentMethod: form.paymentMethod,
          note: form.note,
          type: 'expense',
          monthKey,
          date: form.date,
          receiptGroup,
          receiptTotal,
          receiptStore: form.description,
        })
      })
      navigate(-1)
      return
    }

    if (!form.envelopeId) return
    store.addTransaction({
      description: form.description,
      amount: parseFloat(form.amount),
      envelopeId: form.envelopeId,
      paymentMethod: form.paymentMethod,
      note: form.note,
      type: form.type,
      monthKey,
      date: form.date,
      ...(form.linkedTxId ? { linkedTxId: form.linkedTxId } : {}),
    })
    navigate(-1)
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-accent text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold">
          {form.type === 'income' ? 'Add Income' : 'Add Transaction'}
        </h1>
      </div>

      <form onSubmit={submit} className="px-6 space-y-5">
        {/* Type Toggle — now with Income */}
        <div className="flex bg-surface-2 rounded-xl p-1">
          {['expense', 'income', 'refund'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => { update('type', type); if (type !== 'refund') { clearLinkedTx(); setShowSearch(false) } }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                form.type === type
                  ? type === 'income' ? 'bg-white shadow-sm text-blue-600' : type === 'refund' ? 'bg-white shadow-sm text-success' : 'bg-white shadow-sm text-text'
                  : 'text-text-tertiary'
              }`}
            >
              {type === 'refund' && <RefreshCw size={14} />}
              {type === 'income' && <DollarSign size={14} />}
              {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Refund'}
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

        {form.type === 'income' ? (
          /* Income-specific fields */
          <>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1.5">Source</label>
              <input
                type="text"
                placeholder="e.g. S Income 1, K Income 1, Side gig"
                value={form.incomeSource}
                onChange={e => update('incomeSource', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>

            {/* Quick source buttons */}
            <div className="flex flex-wrap gap-2">
              {['S Income', 'K Income', 'Side Income', 'Bonus', 'Tax Refund'].map(src => (
                <button
                  key={src}
                  type="button"
                  onClick={() => update('incomeSource', form.incomeSource ? form.incomeSource : src)}
                  className="px-3.5 py-2 rounded-xl border border-border-light bg-white text-sm font-medium text-text-secondary active:border-accent active:text-accent transition-all"
                >
                  {src}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Expense/Refund fields */
          <>
            {/* Link to Original Transaction (refund only) */}
            {form.type === 'refund' && (
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Link to original purchase (optional)</label>

                {linkedTx ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                    <Link2 size={16} className="text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">{linkedTx.description}</p>
                      <p className="text-xs text-green-700">
                        {formatCurrency(linkedTx.amount)} · {new Date(linkedTx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button type="button" onClick={clearLinkedTx} className="p-1 rounded-lg text-green-600 active:bg-green-100">
                      <X size={16} />
                    </button>
                  </div>
                ) : !showSearch ? (
                  <button
                    type="button"
                    onClick={() => setShowSearch(true)}
                    className="w-full py-3 rounded-xl border border-dashed border-border text-sm font-medium text-text-secondary flex items-center justify-center gap-2 active:border-accent active:text-accent transition-colors"
                  >
                    <Search size={14} /> Search previous transactions
                  </button>
                ) : (
                  <div className="bg-white rounded-xl border border-border-light p-3 space-y-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        type="text"
                        placeholder="Search by description (e.g. Costco)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
                        autoFocus
                      />
                    </div>

                    {/* Date range */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-text-tertiary block mb-1">From</label>
                        <input
                          type="date"
                          value={searchDateFrom}
                          onChange={e => setSearchDateFrom(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-surface-2 border border-border-light text-xs outline-none focus:border-accent transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-text-tertiary block mb-1">To</label>
                        <input
                          type="date"
                          value={searchDateTo}
                          onChange={e => setSearchDateTo(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-surface-2 border border-border-light text-xs outline-none focus:border-accent transition-all"
                        />
                      </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-48 overflow-y-auto -mx-1">
                      {searchResults.length === 0 ? (
                        <p className="text-xs text-text-tertiary text-center py-4">
                          {searchQuery || searchDateFrom || searchDateTo ? 'No matching transactions' : 'Type to search or set date range'}
                        </p>
                      ) : (
                        searchResults.map(tx => {
                          const env = data.envelopes.find(e => e.id === tx.envelopeId)
                          return (
                            <button
                              key={tx.id}
                              type="button"
                              onClick={() => selectLinkedTx(tx)}
                              className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg text-left active:bg-surface-2 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{tx.description}</p>
                                <p className="text-xs text-text-tertiary">
                                  {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  {env ? ` · ${env.name}` : ''}
                                </p>
                              </div>
                              <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">{formatCurrency(tx.amount)}</span>
                            </button>
                          )
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchDateFrom(''); setSearchDateTo('') }}
                      className="w-full py-2 text-xs font-medium text-text-tertiary"
                    >
                      Cancel search
                    </button>
                  </div>
                )}
              </div>
            )}

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

            {/* Split Toggle */}
            {form.type === 'expense' && (
              <button
                type="button"
                onClick={() => setIsSplit(!isSplit)}
                className={`w-full py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isSplit ? 'border-accent bg-accent-light text-accent' : 'border-border-light text-text-secondary'
                }`}
              >
                <Split size={16} /> Split across categories
              </button>
            )}

            {/* Category — single or split */}
            {isSplit && form.type === 'expense' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-secondary">Split allocations</label>
                  <span className={`text-xs font-semibold tabular-nums ${Math.abs(splitRemaining) < 0.01 ? 'text-accent' : 'text-amber-600'}`}>
                    {Math.abs(splitRemaining) < 0.01 ? 'Balanced' : `${formatCurrency(Math.abs(splitRemaining))} ${splitRemaining > 0 ? 'remaining' : 'over'}`}
                  </span>
                </div>
                <div className="space-y-2">
                  {splits.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={row.envelopeId}
                        onChange={e => updateSplit(idx, 'envelopeId', e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-border-light text-sm outline-none focus:border-accent transition-all"
                      >
                        <option value="">Select category</option>
                        {data.envelopes.map(env => (
                          <option key={env.id} value={env.id}>{CATEGORY_ICONS[env.icon] || '📁'} {env.name}</option>
                        ))}
                      </select>
                      <div className="relative w-24">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={e => updateSplit(idx, 'amount', e.target.value)}
                          className="w-full pl-6 pr-2 py-2.5 rounded-xl bg-surface-2 border border-border-light focus:border-accent outline-none text-sm font-semibold tabular-nums text-right transition-all"
                        />
                      </div>
                      {splits.length > 1 && (
                        <button type="button" onClick={() => removeSplitRow(idx)} className="p-1.5 text-text-tertiary active:text-danger transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addSplitRow} className="mt-2 text-accent text-sm font-medium flex items-center gap-1">
                  <Plus size={14} /> Add category
                </button>
                {form.amount && splitRemaining > 0.01 && (
                  <button
                    type="button"
                    onClick={() => {
                      const lastEmpty = splits.findIndex(s => !parseFloat(s.amount))
                      if (lastEmpty >= 0) updateSplit(lastEmpty, 'amount', splitRemaining.toFixed(2))
                      else setSplits(s => [...s, { envelopeId: '', amount: splitRemaining.toFixed(2) }])
                    }}
                    className="mt-1 text-xs text-text-tertiary"
                  >
                    Auto-fill remaining {formatCurrency(splitRemaining)}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Category</label>
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
            )}

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
          </>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          className={`w-full py-4 font-semibold rounded-xl text-lg active:opacity-90 transition-colors ${
            form.type === 'income' ? 'bg-blue-600 text-white' : 'bg-accent text-white'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {form.type === 'income' ? 'Add Income' : form.type === 'refund' ? 'Add Refund' : 'Add Expense'}
        </motion.button>
      </form>
    </div>
  )
}
