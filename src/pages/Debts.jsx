import { useState, useMemo } from 'react'
import { useStore, store } from '../lib/store'
import { formatCurrency } from '../lib/utils'
import Modal from '../components/Modal'
import { Plus, Trash2, ChevronDown, ChevronUp, DollarSign, TrendingDown, Zap, Snowflake, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STRATEGY_INFO = {
  snowball: { label: 'Snowball', icon: Snowflake, desc: 'Pay smallest balance first — builds momentum' },
  avalanche: { label: 'Avalanche', icon: Zap, desc: 'Pay highest interest first — saves the most money' },
}

const defaultDebtForm = { name: '', balance: '', originalBalance: '', minPayment: '', apr: '', dueDay: '' }

export default function Debts() {
  const data = useStore()
  const navigate = useNavigate()
  const debts = data.debts || []

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showPayment, setShowPayment] = useState(null)
  const [form, setForm] = useState({ ...defaultDebtForm })
  const [editForm, setEditForm] = useState({})
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [strategy, setStrategy] = useState('snowball')
  const [expandedDebt, setExpandedDebt] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [extraPayment, setExtraPayment] = useState('')

  // Sort debts by strategy
  const sortedDebts = useMemo(() => {
    const active = debts.filter(d => d.balance > 0)
    if (strategy === 'snowball') {
      return [...active].sort((a, b) => a.balance - b.balance)
    }
    return [...active].sort((a, b) => (b.apr || 0) - (a.apr || 0))
  }, [debts, strategy])

  const paidOffDebts = debts.filter(d => d.balance <= 0)

  // Totals
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayment = debts.filter(d => d.balance > 0).reduce((s, d) => s + (d.minPayment || 0), 0)
  const totalOriginal = debts.reduce((s, d) => s + (d.originalBalance || d.balance), 0)
  const totalPaid = totalOriginal - totalBalance
  const overallProgress = totalOriginal > 0 ? totalPaid / totalOriginal : 0

  // Payoff calculator
  const payoffData = useMemo(() => {
    const extra = parseFloat(extraPayment) || 0
    const totalMonthly = totalMinPayment + extra

    if (sortedDebts.length === 0 || totalMonthly <= 0) return null

    // Simulate payoff
    let remaining = sortedDebts.map(d => ({
      id: d.id,
      name: d.name,
      balance: d.balance,
      minPayment: d.minPayment || 0,
      apr: d.apr || 0,
      monthlyRate: (d.apr || 0) / 100 / 12,
    }))

    let months = 0
    let totalInterest = 0
    const payoffOrder = []
    const maxMonths = 360 // 30 years cap

    while (remaining.some(d => d.balance > 0) && months < maxMonths) {
      months++
      let availableExtra = extra

      // Add freed-up minimums from paid-off debts
      const activeDebts = remaining.filter(d => d.balance > 0)
      const freedMin = totalMinPayment - activeDebts.reduce((s, d) => s + d.minPayment, 0)
      availableExtra += freedMin

      for (const debt of remaining) {
        if (debt.balance <= 0) continue

        // Apply interest
        const interest = debt.balance * debt.monthlyRate
        totalInterest += interest
        debt.balance += interest

        // Apply minimum payment
        const minPay = Math.min(debt.minPayment, debt.balance)
        debt.balance -= minPay

        // Apply extra to the focus debt (first in sorted order that still has balance)
        if (debt.id === activeDebts[0]?.id && availableExtra > 0) {
          const extraPay = Math.min(availableExtra, debt.balance)
          debt.balance -= extraPay
          availableExtra -= extraPay
        }

        if (debt.balance <= 0.01) {
          debt.balance = 0
          payoffOrder.push({ name: debt.name, month: months })
        }
      }
    }

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    const timeLabel = years > 0
      ? `${years}y ${remainingMonths}m`
      : `${remainingMonths} months`

    return { months, timeLabel, totalInterest, payoffOrder }
  }, [sortedDebts, extraPayment, totalMinPayment])

  const submitDebt = (e) => {
    e.preventDefault()
    if (!form.name || !form.balance) return
    const balance = parseFloat(form.balance)
    store.addDebt({
      name: form.name,
      balance,
      originalBalance: parseFloat(form.originalBalance) || balance,
      minPayment: parseFloat(form.minPayment) || 0,
      apr: parseFloat(form.apr) || 0,
      dueDay: parseInt(form.dueDay) || 1,
    })
    setForm({ ...defaultDebtForm })
    setShowAdd(false)
  }

  const openEdit = (debt) => {
    setEditForm({
      name: debt.name,
      balance: String(debt.balance),
      originalBalance: String(debt.originalBalance || debt.balance),
      minPayment: String(debt.minPayment || ''),
      apr: String(debt.apr || ''),
      dueDay: String(debt.dueDay || ''),
    })
    setShowEdit(debt.id)
    setConfirmDelete(null)
  }

  const saveEdit = () => {
    if (!editForm.name || !editForm.balance) return
    const balance = parseFloat(editForm.balance)
    store.updateDebt(showEdit, {
      name: editForm.name,
      balance,
      originalBalance: parseFloat(editForm.originalBalance) || balance,
      minPayment: parseFloat(editForm.minPayment) || 0,
      apr: parseFloat(editForm.apr) || 0,
      dueDay: parseInt(editForm.dueDay) || 1,
    })
    setShowEdit(null)
  }

  const submitPayment = (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) return
    store.addDebtPayment(showPayment, { amount, note: paymentNote })
    setPaymentAmount('')
    setPaymentNote('')
    setShowPayment(null)
  }

  const DebtFormFields = ({ form: f, setForm: sf }) => (
    <>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">Name</label>
        <input type="text" placeholder="e.g. Student Loan" value={f.name || ''} onChange={e => sf(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" autoFocus />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Current Balance</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
            <input type="number" step="0.01" placeholder="0.00" value={f.balance || ''} onChange={e => sf(p => ({ ...p, balance: e.target.value }))} className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Original Balance</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
            <input type="number" step="0.01" placeholder="0.00" value={f.originalBalance || ''} onChange={e => sf(p => ({ ...p, originalBalance: e.target.value }))} className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Min Payment</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
            <input type="number" step="0.01" placeholder="0.00" value={f.minPayment || ''} onChange={e => sf(p => ({ ...p, minPayment: e.target.value }))} className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>
        </div>
        <div className="w-24">
          <label className="text-sm font-medium text-text-secondary block mb-1.5">APR %</label>
          <input type="number" step="0.01" placeholder="0" value={f.apr || ''} onChange={e => sf(p => ({ ...p, apr: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
        </div>
        <div className="w-20">
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Due</label>
          <input type="number" min="1" max="31" placeholder="1" value={f.dueDay || ''} onChange={e => sf(p => ({ ...p, dueDay: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Debt Snowball</h1>
            <p className="text-sm text-text-secondary mt-0.5">Track & crush your debts</p>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      {debts.length > 0 && (
        <div className="px-5 mt-4">
          <div className="bg-gradient-to-br from-[#0f7b6c] to-[#0a5c51] rounded-2xl p-5 text-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Debt</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Paid Off</p>
                <p className="text-lg font-semibold mt-1">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(overallProgress * 100, 100)}%` }} />
            </div>
            <p className="text-white/60 text-xs mt-2">{(overallProgress * 100).toFixed(1)}% paid off · Min payments: {formatCurrency(totalMinPayment)}/mo</p>
          </div>
        </div>
      )}

      {/* Strategy Toggle */}
      {debts.length > 0 && (
        <div className="px-5 mt-5">
          <div className="flex gap-2 bg-surface-2 rounded-xl p-1">
            {Object.entries(STRATEGY_INFO).map(([key, { label, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => setStrategy(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  strategy === key ? 'bg-white shadow-sm text-accent' : 'text-text-tertiary'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-tertiary mt-2 text-center">{STRATEGY_INFO[strategy].desc}</p>
        </div>
      )}

      {/* Payoff Calculator */}
      {sortedDebts.length > 0 && (
        <div className="px-5 mt-5">
          <div className="bg-white rounded-2xl border border-border-light p-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Payoff Calculator</h3>
            <div className="flex gap-3 items-end mb-3">
              <div className="flex-1">
                <label className="text-xs text-text-tertiary block mb-1">Extra monthly payment</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={extraPayment}
                    onChange={e => setExtraPayment(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-surface-2 border border-border-light focus:border-accent outline-none text-sm"
                  />
                </div>
              </div>
            </div>
            {payoffData && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-xs text-text-tertiary">Debt-free in</p>
                  <p className="text-lg font-bold text-accent">{payoffData.timeLabel}</p>
                </div>
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-xs text-text-tertiary">Total interest</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(payoffData.totalInterest)}</p>
                </div>
              </div>
            )}
            {payoffData?.payoffOrder.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-text-tertiary font-medium">Payoff order:</p>
                {payoffData.payoffOrder.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-text-tertiary ml-auto">month {p.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debt List */}
      {sortedDebts.length > 0 && (
        <div className="px-5 mt-5">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Active Debts ({sortedDebts.length})
          </h3>
          <div className="space-y-3">
            {sortedDebts.map((debt, idx) => {
              const originalBal = debt.originalBalance || debt.balance
              const progress = originalBal > 0 ? (originalBal - debt.balance) / originalBal : 0
              const isExpanded = expandedDebt === debt.id
              const isFocus = idx === 0

              return (
                <div key={debt.id} className={`bg-white rounded-2xl border ${isFocus ? 'border-accent/30 ring-1 ring-accent/20' : 'border-border-light'} overflow-hidden`}>
                  <button
                    onClick={() => setExpandedDebt(isExpanded ? null : debt.id)}
                    className="w-full px-4 py-3.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isFocus && <TrendingDown size={14} className="text-accent" />}
                        <span className="font-semibold text-[15px]">{debt.name}</span>
                        {isFocus && <span className="text-[10px] font-medium text-accent bg-accent-light px-1.5 py-0.5 rounded-full">FOCUS</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[15px] tabular-nums">{formatCurrency(debt.balance)}</span>
                        {isExpanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden">
                        <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-text-tertiary tabular-nums">{(progress * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-tertiary">
                      <span>Min: {formatCurrency(debt.minPayment || 0)}/mo</span>
                      {debt.apr > 0 && <span>APR: {debt.apr}%</span>}
                      {debt.dueDay && <span>Due: day {debt.dueDay}</span>}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border-light pt-3 space-y-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setShowPayment(debt.id); setPaymentAmount(String(debt.minPayment || '')) }} className="flex-1 py-2.5 bg-accent text-white font-medium text-sm rounded-xl flex items-center justify-center gap-1.5">
                          <DollarSign size={14} /> Log Payment
                        </button>
                        <button onClick={() => openEdit(debt)} className="px-4 py-2.5 bg-surface-2 text-text-secondary font-medium text-sm rounded-xl">
                          Edit
                        </button>
                      </div>

                      {/* Recent payments */}
                      {(debt.payments || []).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-text-tertiary mb-1.5">Recent Payments</p>
                          <div className="space-y-1">
                            {[...(debt.payments || [])].reverse().slice(0, 5).map(p => (
                              <div key={p.id} className="flex items-center justify-between text-sm py-1.5">
                                <div>
                                  <span className="font-medium text-accent">-{formatCurrency(p.amount)}</span>
                                  {p.note && <span className="text-text-tertiary ml-2 text-xs">{p.note}</span>}
                                </div>
                                <span className="text-xs text-text-tertiary">{new Date(p.date).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Paid Off */}
      {paidOffDebts.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Paid Off ({paidOffDebts.length})
          </h3>
          <div className="space-y-2">
            {paidOffDebts.map(debt => (
              <div key={debt.id} className="bg-white rounded-2xl border border-border-light px-4 py-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[15px] line-through">{debt.name}</span>
                  <span className="text-sm font-medium text-accent">PAID OFF</span>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">Original: {formatCurrency(debt.originalBalance || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {debts.length === 0 && (
        <div className="px-5 mt-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
            <Snowflake size={28} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Start Your Debt Snowball</h3>
          <p className="text-sm text-text-tertiary max-w-xs mx-auto">Add your debts and watch them melt away. The snowball method builds momentum by tackling the smallest balance first.</p>
        </div>
      )}

      {/* Add Debt Button */}
      <div className="px-5 mt-5">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={18} /> Add Debt
        </button>
      </div>

      {/* Add Debt Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Debt">
        <form onSubmit={submitDebt} className="space-y-4">
          <DebtFormFields form={form} setForm={setForm} />
          <button type="submit" className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">Add Debt</button>
        </form>
      </Modal>

      {/* Edit Debt Modal */}
      <Modal open={!!showEdit} onClose={() => { setShowEdit(null); setConfirmDelete(null) }} title="Edit Debt">
        <div className="space-y-4">
          <DebtFormFields form={editForm} setForm={setEditForm} />
          <button onClick={saveEdit} className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">Save Changes</button>

          <div className="pt-2 border-t border-border-light">
            {confirmDelete !== showEdit ? (
              <button onClick={() => setConfirmDelete(showEdit)} className="w-full py-3 text-sm font-medium text-danger flex items-center justify-center gap-1.5">
                <Trash2 size={14} /> Delete Debt
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-text-secondary">Delete this debt and all payment history?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-border-light text-sm font-medium text-text-secondary">Cancel</button>
                  <button onClick={() => { store.deleteDebt(showEdit); setShowEdit(null); setConfirmDelete(null) }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium active:bg-red-600">Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Log Payment Modal */}
      <Modal open={!!showPayment} onClose={() => setShowPayment(null)} title="Log Payment">
        <form onSubmit={submitPayment} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input type="number" step="0.01" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" autoFocus />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Note <span className="text-text-tertiary font-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. Extra payment from bonus" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>
          <button type="submit" className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">Log Payment</button>
        </form>
      </Modal>
    </div>
  )
}
