import { useState, useMemo } from 'react'
import { useStore, useTotalIncome, useTotalBills, useTotalSpent, isBillPaidForMonth, store } from '../lib/store'
import { formatCurrency, formatCompact, getMonthName, getDueDateLabel, getCurrentMonthKey, getPrevMonthKey, getNextMonthKey, isBillActive, CATEGORY_ICONS } from '../lib/utils'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, ChevronLeft, Settings, DollarSign, Snowflake } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const data = useStore()
  const navigate = useNavigate()
  const totalIncome = useTotalIncome()
  const totalBillsAmount = useTotalBills()
  const totalSpent = useTotalSpent()
  const billsPaid = data.bills.filter(b => isBillPaidForMonth(b, data.currentMonth)).reduce((s, b) => s + b.amount, 0)
  const billsUnpaid = data.bills.filter(b => !isBillPaidForMonth(b, data.currentMonth))
  const remaining = totalIncome - billsPaid - totalSpent

  const [showAddIncome, setShowAddIncome] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '' })

  const isCurrentMonth = data.currentMonth === getCurrentMonthKey()

  // Expense breakdown by category for pie chart
  const categoryBreakdown = useMemo(() => {
    const monthTxs = data.transactions.filter(t => t.monthKey === data.currentMonth && t.type !== 'refund')
    const byCategory = {}
    monthTxs.forEach(t => {
      const env = data.envelopes.find(e => e.id === t.envelopeId)
      const catName = env?.name || 'Other'
      const icon = env?.icon || 'tag'
      if (!byCategory[catName]) byCategory[catName] = { name: catName, icon, value: 0 }
      byCategory[catName].value += t.amount
    })
    return Object.values(byCategory).sort((a, b) => b.value - a.value)
  }, [data.transactions, data.envelopes, data.currentMonth])

  const PIE_COLORS = ['#0f7b6c', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b', '#ef4444', '#6366f1']

  const submitIncome = (e) => {
    e.preventDefault()
    if (!incomeForm.source || !incomeForm.amount) return
    store.addIncome({ source: incomeForm.source, amount: parseFloat(incomeForm.amount), monthKey: data.currentMonth })
    setIncomeForm({ source: '', amount: '' })
    setShowAddIncome(false)
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f7b6c] to-[#0a5c51] text-white px-6 pt-14 pb-8 rounded-b-[2rem]">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => store.setMonth(getPrevMonthKey(data.currentMonth))} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-white/90 text-sm font-semibold">{getMonthName(data.currentMonth)}</span>
          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <button onClick={() => store.setMonth(getCurrentMonthKey())} className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium active:bg-white/30">
                Today
              </button>
            )}
            <button onClick={() => store.setMonth(getNextMonthKey(data.currentMonth))} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="mt-2">
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Available Balance</span>
          <motion.p
            className="text-4xl font-bold tracking-tight mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={data.currentMonth}
          >
            {formatCurrency(remaining)}
          </motion.p>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setShowAddIncome(true)}
            className="flex-1 bg-white/15 rounded-2xl px-4 py-3 active:bg-white/25 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight size={14} className="text-green-300" />
              <span className="text-white/60 text-xs">Income</span>
              <Plus size={12} className="text-white/40 ml-auto" />
            </div>
            <p className="text-lg font-semibold">{formatCompact(totalIncome)}</p>
          </button>
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight size={14} className="text-red-300" />
              <span className="text-white/60 text-xs">Spent</span>
            </div>
            <p className="text-lg font-semibold">{formatCompact(billsPaid + totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 -mt-5">
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/scan')}
            className="flex-1 bg-white rounded-2xl shadow-sm border border-border-light p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Camera size={20} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Scan Receipt</p>
              <p className="text-xs text-text-tertiary">Photo or screenshot</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/add')}
            className="flex-1 bg-white rounded-2xl shadow-sm border border-border-light p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Plus size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Quick Add</p>
              <p className="text-xs text-text-tertiary">Manual entry</p>
            </div>
          </button>
        </div>
      </div>

      {/* Debt Snowball Link */}
      <div className="px-5 mt-5">
        <button
          onClick={() => navigate('/debts')}
          className="w-full bg-white rounded-2xl shadow-sm border border-border-light p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Snowflake size={20} className="text-purple-600" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold">Debt Snowball</p>
            <p className="text-xs text-text-tertiary">
              {(data.debts || []).length > 0
                ? `${formatCurrency((data.debts || []).reduce((s, d) => s + d.balance, 0))} remaining`
                : 'Track & crush your debts'}
            </p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary" />
        </button>
      </div>

      {/* Income vs Expenses Breakdown */}
      <div className="px-5 mt-7">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Spending Breakdown</h3>
        <div className="bg-white rounded-2xl border border-border-light p-4">
          {/* Income vs Expense bars */}
          <div className="space-y-2 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-tertiary">Income</span>
                <span className="font-semibold text-blue-600">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: totalIncome > 0 ? '100%' : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-tertiary">Expenses</span>
                <span className="font-semibold text-red-500">{formatCurrency(billsPaid + totalSpent)}</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden">
                <div className="bg-red-400 h-full rounded-full transition-all duration-500" style={{ width: totalIncome > 0 ? `${Math.min(((billsPaid + totalSpent) / totalIncome) * 100, 100)}%` : '0%' }} />
              </div>
            </div>
          </div>

          {/* Category pie chart + legend */}
          {categoryBreakdown.length > 0 && (
            <div className="pt-3 border-t border-border-light">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">By Category</p>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={40} strokeWidth={1}>
                        {categoryBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 max-h-32 overflow-y-auto">
                  {categoryBreakdown.slice(0, 6).map((cat, idx) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-xs truncate flex-1">{CATEGORY_ICONS[cat.icon] || '📁'} {cat.name}</span>
                      <span className="text-xs font-semibold tabular-nums">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                  {categoryBreakdown.length > 6 && (
                    <p className="text-[10px] text-text-tertiary">+{categoryBreakdown.length - 6} more</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Income Modal */}
      <Modal open={showAddIncome} onClose={() => setShowAddIncome(false)} title="Add Income">
        <form onSubmit={submitIncome} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Source</label>
            <input
              type="text"
              placeholder="e.g. S Income 1, K Income 1"
              value={incomeForm.source}
              onChange={e => setIncomeForm(f => ({ ...f, source: e.target.value }))}
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
                placeholder="0.00"
                value={incomeForm.amount}
                onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">
            Add Income
          </button>
        </form>
      </Modal>
    </div>
  )
}
