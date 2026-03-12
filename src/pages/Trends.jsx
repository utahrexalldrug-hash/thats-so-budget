import { useStore } from '../lib/store'
import { formatCurrency, getMonthName, getPrevMonthKey, CATEGORY_ICONS, PAYMENT_METHODS } from '../lib/utils'
import { PieChart, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RPieChart, Pie } from 'recharts'

const COLORS = ['#0f7b6c', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#e11d48', '#f97316', '#f59e0b', '#14b8a6', '#64748b', '#10b981', '#ef4444']

export default function Trends() {
  const data = useStore()
  const monthTxs = data.transactions.filter(t => t.monthKey === data.currentMonth && t.type !== 'refund')
  const refunds = data.transactions.filter(t => t.monthKey === data.currentMonth && t.type === 'refund')
  const totalSpent = monthTxs.reduce((s, t) => s + t.amount, 0)
  const totalRefunds = refunds.reduce((s, t) => s + t.amount, 0)

  // Spending by envelope for bar chart
  const byEnvelope = data.envelopes.map(env => {
    const spent = monthTxs.filter(t => t.envelopeId === env.id).reduce((s, t) => s + t.amount, 0)
    return { name: env.name, spent, budget: env.budget, color: env.color, icon: env.icon, pct: env.budget > 0 ? spent / env.budget : 0 }
  }).filter(e => e.spent > 0 || e.budget > 0).sort((a, b) => b.spent - a.spent)

  // Payment method breakdown for reconciliation
  const byPayment = {}
  data.transactions.filter(t => t.monthKey === data.currentMonth).forEach(t => {
    const key = (t.paymentMethod || 'other')
    if (!byPayment[key]) byPayment[key] = { expenses: 0, refunds: 0, count: 0 }
    if (t.type === 'refund') {
      byPayment[key].refunds += t.amount
    } else {
      byPayment[key].expenses += t.amount
    }
    byPayment[key].count++
  })

  // Budget vs actual chart data
  const budgetVsActual = data.envelopes
    .filter(e => e.budget > 0)
    .map(env => {
      const spent = monthTxs.filter(t => t.envelopeId === env.id).reduce((s, t) => s + t.amount, 0)
      return { name: env.name.length > 12 ? env.name.slice(0, 12) + '…' : env.name, budget: env.budget, spent, color: env.color }
    })

  // Pie chart data for payment methods
  const pieData = Object.entries(byPayment).map(([key, val]) => {
    const pm = PAYMENT_METHODS.find(p => p.id === key)
    return { name: pm ? pm.short : key.toUpperCase(), value: val.expenses - val.refunds }
  }).filter(d => d.value > 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border-light rounded-xl px-3 py-2 shadow-lg">
          <p className="text-xs font-medium text-text-secondary">{payload[0].payload.name}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Trends</h1>
        <p className="text-sm text-text-secondary mt-1">{getMonthName(data.currentMonth)}</p>
      </div>

      {/* Total Spent Card */}
      <div className="px-5">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Spent This Month</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
          <div className="flex gap-4 mt-2">
            <p className="text-white/40 text-xs">{monthTxs.length} transactions</p>
            {totalRefunds > 0 && <p className="text-green-400/60 text-xs">+{formatCurrency(totalRefunds)} refunds</p>}
          </div>
        </div>
      </div>

      {/* Budget vs Actual Bar Chart */}
      {budgetVsActual.length > 0 && (
        <div className="px-5 mt-7">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Budget vs Actual</h3>
          <div className="bg-white rounded-2xl border border-border-light p-4">
            <ResponsiveContainer width="100%" height={budgetVsActual.length * 50 + 20}>
              <BarChart data={budgetVsActual} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <XAxis type="number" tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="budget" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={16} name="Budget" />
                <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={16} name="Spent">
                  {budgetVsActual.map((entry, i) => (
                    <Cell key={i} fill={entry.spent > entry.budget ? '#ef4444' : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Budget</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent inline-block" /> Spent</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Over</span>
            </div>
          </div>
        </div>
      )}

      {/* Spending by Category */}
      <div className="px-5 mt-7">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">By Category</h3>
        {byEnvelope.filter(e => e.spent > 0).length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <PieChart size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No spending data yet</p>
            <p className="text-xs mt-1">Add some transactions to see trends</p>
          </div>
        ) : (
          <div className="space-y-3">
            {byEnvelope.filter(e => e.spent > 0).map((env, i) => {
              const icon = CATEGORY_ICONS[env.icon] || '📁'
              return (
                <motion.div
                  key={env.name}
                  className="bg-white rounded-xl border border-border-light p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="text-sm font-medium">{env.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(env.spent)}</span>
                      <span className={`text-xs ml-2 ${env.pct > 1 ? 'text-danger font-semibold' : 'text-text-tertiary'}`}>{Math.round(env.pct * 100)}%</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: env.pct > 1 ? '#ef4444' : env.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(env.pct * 100, 100)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment Method Reconciliation */}
      {Object.keys(byPayment).length > 0 && (
        <div className="px-5 mt-7">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <CreditCard size={14} /> Card Reconciliation
          </h3>
          <div className="space-y-3">
            {Object.entries(byPayment).sort((a, b) => (b[1].expenses - b[1].refunds) - (a[1].expenses - a[1].refunds)).map(([method, amounts]) => {
              const pm = PAYMENT_METHODS.find(p => p.id === method)
              const label = pm ? pm.label : method.toUpperCase()
              const shortLabel = pm ? pm.short : method.toUpperCase()
              const net = amounts.expenses - amounts.refunds
              return (
                <div key={method} className="bg-white rounded-2xl border border-border-light p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-lg font-bold tabular-nums">{formatCurrency(net)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <span>{amounts.count} transactions</span>
                    {amounts.refunds > 0 && <span className="text-green-600">−{formatCurrency(amounts.refunds)} refunds</span>}
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    This should match your {shortLabel} statement for {getMonthName(data.currentMonth)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pie Chart of Payment Methods */}
      {pieData.length > 1 && (
        <div className="px-5 mt-7">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Payment Split</h3>
          <div className="bg-white rounded-2xl border border-border-light p-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-5 mt-7">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Transactions</h3>
        {data.transactions.filter(t => t.monthKey === data.currentMonth).length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">No transactions yet</p>
        ) : (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            {data.transactions.filter(t => t.monthKey === data.currentMonth).slice(-10).reverse().map(tx => {
              const env = data.envelopes.find(e => e.id === tx.envelopeId)
              const icon = CATEGORY_ICONS[env?.icon] || '📁'
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-0">
                  <span className="text-base">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-text-tertiary">{env?.name}{tx.paymentMethod ? ` · ${tx.paymentMethod.toUpperCase()}` : ''}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.type === 'refund' ? 'text-success' : ''}`}>
                    {tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
