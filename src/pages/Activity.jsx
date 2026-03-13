import { useState, useMemo } from 'react'
import { useStore, store } from '../lib/store'
import { formatCurrency, CATEGORY_ICONS, PAYMENT_METHODS, getMonthName } from '../lib/utils'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Pencil, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, X, Plus, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Activity() {
  const data = useStore()
  const navigate = useNavigate()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // all, expense, refund, income
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState('month') // month, 7days, 30days, custom
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [filterCard, setFilterCard] = useState('all') // all, scc, kcc, debit, cash

  // Edit state
  const [expandedTx, setExpandedTx] = useState(null)
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [editingTx, setEditingTx] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Build combined list of transactions + income
  const allItems = useMemo(() => {
    let items = []

    // Add transactions
    data.transactions.forEach(t => {
      items.push({
        ...t,
        itemType: t.type === 'refund' ? 'refund' : 'expense',
        sortDate: t.date || t.createdAt?.split('T')[0] || '',
      })
    })

    // Add income
    if (filterType === 'all' || filterType === 'income') {
      data.income.forEach(i => {
        items.push({
          id: i.id,
          description: i.source,
          amount: i.amount,
          itemType: 'income',
          monthKey: i.monthKey,
          createdAt: i.createdAt,
          sortDate: i.createdAt?.split('T')[0] || '',
        })
      })
    }

    // Filter by type
    if (filterType === 'expense') items = items.filter(i => i.itemType === 'expense')
    if (filterType === 'refund') items = items.filter(i => i.itemType === 'refund')
    if (filterType === 'income') items = items.filter(i => i.itemType === 'income')

    // Filter by date range
    const now = new Date()
    if (dateRange === 'month') {
      items = items.filter(i => i.monthKey === data.currentMonth)
    } else if (dateRange === '7days') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      items = items.filter(i => i.sortDate >= cutoff)
    } else if (dateRange === '30days') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      items = items.filter(i => i.sortDate >= cutoff)
    } else if (dateRange === 'custom') {
      if (customFrom) items = items.filter(i => i.sortDate >= customFrom)
      if (customTo) items = items.filter(i => i.sortDate <= customTo)
    }

    // Filter by card
    if (filterCard !== 'all') {
      items = items.filter(i => i.paymentMethod === filterCard)
    }

    // Filter by search (description, amount, or date)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i => {
        // Match description
        if (i.description?.toLowerCase().includes(q)) return true
        // Match amount (e.g. "45", "45.00", "$45")
        const amt = Number(i.amount)
        const qClean = q.replace(/[$,]/g, '')
        if (!isNaN(amt) && qClean && (
          String(amt).includes(qClean) ||
          amt.toFixed(2).includes(qClean)
        )) return true
        // Match date (e.g. "mar", "mar 5", "3/5", "2026-03")
        if (i.createdAt) {
          const d = new Date(i.createdAt)
          const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
          const formatted2 = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase()
          const numeric = `${d.getMonth() + 1}/${d.getDate()}`
          const iso = i.sortDate || ''
          if (formatted.includes(q) || formatted2.includes(q) || numeric.includes(q) || iso.includes(q)) return true
        }
        return false
      })
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    return items
  }, [data.transactions, data.income, data.currentMonth, filterType, dateRange, customFrom, customTo, searchQuery, filterCard])

  // Totals
  const totals = useMemo(() => {
    const expenses = allItems.filter(i => i.itemType === 'expense').reduce((s, i) => s + i.amount, 0)
    const refunds = allItems.filter(i => i.itemType === 'refund').reduce((s, i) => s + i.amount, 0)
    const income = allItems.filter(i => i.itemType === 'income').reduce((s, i) => s + i.amount, 0)
    return { expenses, refunds, income, net: income - expenses + refunds }
  }, [allItems])

  // Group receipt items together for display
  const displayItems = useMemo(() => {
    const groups = {}
    const result = []
    const seen = new Set()

    allItems.forEach(item => {
      if (item.receiptGroup && !seen.has(item.receiptGroup)) {
        seen.add(item.receiptGroup)
        const groupItems = allItems.filter(i => i.receiptGroup === item.receiptGroup)
        result.push({
          type: 'group',
          id: item.receiptGroup,
          receiptStore: item.receiptStore || item.description,
          receiptTotal: item.receiptTotal || groupItems.reduce((s, i) => s + i.amount, 0),
          items: groupItems,
          createdAt: item.createdAt,
          paymentMethod: item.paymentMethod,
        })
      } else if (!item.receiptGroup) {
        result.push({ type: 'single', ...item })
      }
    })

    return result
  }, [allItems])

  const startEdit = (tx) => {
    setEditForm({
      description: tx.description,
      amount: String(tx.amount),
      paymentMethod: tx.paymentMethod || 'scc',
      note: tx.note || '',
      envelopeId: tx.envelopeId || '',
    })
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
      envelopeId: editForm.envelopeId,
    })
    setEditingTx(null)
  }

  const deleteTx = (txId) => {
    store.deleteTransaction(txId)
    setExpandedTx(null)
  }

  const deleteGroup = (groupId) => {
    const groupItems = data.transactions.filter(t => t.receiptGroup === groupId)
    groupItems.forEach(t => store.deleteTransaction(t.id))
    setExpandedGroup(null)
  }

  const dateRangeLabel = dateRange === 'month' ? getMonthName(data.currentMonth) : dateRange === '7days' ? 'Last 7 days' : dateRange === '30days' ? 'Last 30 days' : 'Custom range'

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Activity</h1>
          <button onClick={() => navigate('/trends')} className="text-sm font-medium text-accent">
            Trends & Charts
          </button>
        </div>
        <p className="text-sm text-text-secondary mt-1">{dateRangeLabel} · {allItems.length} items</p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="px-5 mt-3 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, amount, or date..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-all ${
              showFilters ? 'bg-accent text-white border-accent' : 'bg-white border-border-light text-text-secondary'
            }`}
          >
            <Filter size={14} />
          </button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-xl border border-border-light p-3 space-y-3">
                {/* Type filter */}
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wider font-medium block mb-1.5">Type</label>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'expense', label: 'Expenses' },
                      { value: 'income', label: 'Income' },
                      { value: 'refund', label: 'Refunds' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterType(opt.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          filterType === opt.value ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card filter */}
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wider font-medium block mb-1.5">Card</label>
                  <div className="flex gap-1.5">
                    {[{ value: 'all', label: 'All' }, ...PAYMENT_METHODS.map(pm => ({ value: pm.id, label: pm.short }))].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterCard(opt.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          filterCard === opt.value ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wider font-medium block mb-1.5">Date Range</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { value: '7days', label: '7 days' },
                      { value: 'month', label: 'This month' },
                      { value: '30days', label: '30 days' },
                      { value: 'custom', label: 'Custom' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDateRange(opt.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          dateRange === opt.value ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom date inputs */}
                {dateRange === 'custom' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-text-tertiary block mb-1">From</label>
                      <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-full px-2.5 py-2 rounded-lg bg-surface-2 border border-border-light text-xs outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-text-tertiary block mb-1">To</label>
                      <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-full px-2.5 py-2 rounded-lg bg-surface-2 border border-border-light text-xs outline-none focus:border-accent transition-all" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search results total */}
      {searchQuery.trim() && allItems.length > 0 && (
        <div className="px-5 mt-4">
          <div className="bg-accent-light rounded-xl border border-accent/20 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-accent font-medium">Search results: {allItems.length} item{allItems.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-text-tertiary mt-0.5">Matching "{searchQuery}"</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-accent">{formatCurrency(totals.expenses + totals.income + totals.refunds)}</p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="px-5 mt-4">
        <div className="flex gap-2">
          {totals.expenses > 0 && (
            <div className="flex-1 bg-white rounded-xl border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <ArrowDownRight size={12} className="text-red-400" />
                <span className="text-[10px] text-text-tertiary uppercase">Expenses</span>
              </div>
              <p className="text-sm font-bold tabular-nums">{formatCurrency(totals.expenses)}</p>
            </div>
          )}
          {totals.income > 0 && (
            <div className="flex-1 bg-white rounded-xl border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <ArrowUpRight size={12} className="text-blue-400" />
                <span className="text-[10px] text-text-tertiary uppercase">Income</span>
              </div>
              <p className="text-sm font-bold tabular-nums text-blue-600">{formatCurrency(totals.income)}</p>
            </div>
          )}
          {totals.refunds > 0 && (
            <div className="flex-1 bg-white rounded-xl border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <RefreshCw size={12} className="text-green-400" />
                <span className="text-[10px] text-text-tertiary uppercase">Refunds</span>
              </div>
              <p className="text-sm font-bold tabular-nums text-success">{formatCurrency(totals.refunds)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 mt-4">
        {allItems.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <p className="text-sm">No transactions found</p>
            <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Add some transactions to get started'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            {displayItems.map(item => {
              if (item.type === 'group') {
                const isOpen = expandedGroup === item.id
                return (
                  <div key={item.id} className="border-b border-border-light last:border-0">
                    {/* Group header */}
                    <button
                      onClick={() => setExpandedGroup(isOpen ? null : item.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-surface-2 transition-colors"
                    >
                      <span className="text-base shrink-0">🧾</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.receiptStore}</p>
                        <p className="text-xs text-text-tertiary">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          {` · ${item.items.length} items`}
                          {item.paymentMethod ? ` · ${item.paymentMethod.toUpperCase()}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0">-{formatCurrency(item.receiptTotal)}</span>
                      <ChevronDown size={14} className={`text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded: show individual items by category */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="bg-surface-2/50 px-4 pb-3 space-y-1">
                            {item.items.map(sub => {
                              const env = data.envelopes.find(e => e.id === sub.envelopeId)
                              const subIcon = CATEGORY_ICONS[env?.icon] || '📁'
                              return (
                                <div key={sub.id} className="flex items-center justify-between py-1.5">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-xs shrink-0">{subIcon}</span>
                                    <span className="text-xs text-text-secondary truncate">{env?.name || 'Unknown'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-semibold tabular-nums">{formatCurrency(sub.amount)}</span>
                                    <button onClick={() => deleteTx(sub.id)} className="p-1 rounded-lg text-text-tertiary active:text-danger transition-colors">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                            <div className="pt-2 mt-1 border-t border-border-light">
                              <button onClick={() => deleteGroup(item.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-xs font-medium text-danger active:bg-red-100 transition-colors">
                                <Trash2 size={12} /> Delete entire receipt
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              // Single transaction (unchanged)
              const tx = item
              const env = data.envelopes.find(e => e.id === tx.envelopeId)
              const icon = tx.itemType === 'income' ? '💵' : (CATEGORY_ICONS[env?.icon] || '📁')
              const isIncome = tx.itemType === 'income'
              const isRefund = tx.itemType === 'refund'

              return (
                <div key={tx.id} className="border-b border-border-light last:border-0">
                  <button
                    onClick={() => !isIncome && setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-surface-2 transition-colors"
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-text-tertiary">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        {env?.name ? ` · ${env.name}` : ''}
                        {tx.paymentMethod ? ` · ${tx.paymentMethod.toUpperCase()}` : ''}
                        {isIncome && ' · Income'}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums shrink-0 ${isRefund ? 'text-success' : isIncome ? 'text-blue-600' : ''}`}>
                      {isRefund ? '+' : isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </button>

                  {/* Expand actions (not for income) */}
                  {!isIncome && (
                    <AnimatePresence>
                      {expandedTx === tx.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="flex gap-2 pb-3 px-4">
                            <button onClick={() => startEdit(tx)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-2 text-sm font-medium text-text-secondary active:bg-surface-3 transition-colors">
                              <Pencil size={14} /> Edit
                            </button>
                            <button onClick={() => deleteTx(tx.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-sm font-medium text-danger active:bg-red-100 transition-colors">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Quick Add Button */}
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Plus size={24} />
      </button>

      {/* Edit Transaction Modal — with category picker */}
      <Modal open={!!editingTx} onClose={() => setEditingTx(null)} title="Edit Transaction">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Description</label>
            <input type="text" value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input type="number" step="0.01" value={editForm.amount || ''} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {data.envelopes.map(env => {
                const envIcon = CATEGORY_ICONS[env.icon] || '📁'
                return (
                  <button key={env.id} type="button" onClick={() => setEditForm(f => ({ ...f, envelopeId: env.id }))} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${editForm.envelopeId === env.id ? 'border-accent bg-accent-light' : 'border-border-light'}`}>
                    <span className="text-sm">{envIcon}</span>
                    <span className="text-xs font-medium truncate">{env.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} type="button" onClick={() => setEditForm(f => ({ ...f, paymentMethod: pm.id }))} className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${editForm.paymentMethod === pm.id ? 'border-accent bg-accent-light text-accent' : 'border-border-light text-text-secondary'}`}>
                  {pm.short}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Note</label>
            <input type="text" value={editForm.note || ''} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional note" className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>
          <button onClick={saveEdit} className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">Save Changes</button>
        </div>
      </Modal>
    </div>
  )
}
