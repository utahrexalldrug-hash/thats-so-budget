import { useStore } from '../lib/store'
import { formatCurrency, CATEGORY_ICONS } from '../lib/utils'
import { BarChart3, TrendingUp, PieChart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Trends() {
  const data = useStore()
  const monthTxs = data.transactions.filter(t => t.monthKey === data.currentMonth && t.type !== 'refund')
  const totalSpent = monthTxs.reduce((s, t) => s + t.amount, 0)

  const byEnvelope = data.envelopes.map(env => {
    const spent = monthTxs.filter(t => t.envelopeId === env.id).reduce((s, t) => s + t.amount, 0)
    return { ...env, spent, pct: totalSpent > 0 ? spent / totalSpent : 0 }
  }).filter(e => e.spent > 0).sort((a, b) => b.spent - a.spent)

  const byPayment = {}
  monthTxs.forEach(t => {
    const key = (t.paymentMethod || 'other').toUpperCase()
    byPayment[key] = (byPayment[key] || 0) + t.amount
  })

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Trends</h1>
        <p className="text-sm text-text-secondary mt-1">Where your money goes</p>
      </div>

      {/* Total Spent Card */}
      <div className="px-5">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Spent This Month</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
          <p className="text-white/40 text-xs mt-2">{monthTxs.length} transactions</p>
        </div>
      </div>

      {/* By Category */}
      <div className="px-5 mt-7">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">By Category</h3>
        {byEnvelope.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <PieChart size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No spending data yet</p>
            <p className="text-xs mt-1">Add some transactions to see trends</p>
          </div>
        ) : (
          <div className="space-y-3">
            {byEnvelope.map((env, i) => {
              const icon = CATEGORY_ICONS[env.icon] || '📁'
              return (
                <motion.div
                  key={env.id}
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
                      <span className="text-xs text-text-tertiary ml-2">{Math.round(env.pct * 100)}%</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: env.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${env.pct * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* By Payment Method */}
      {Object.keys(byPayment).length > 0 && (
        <div className="px-5 mt-7">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">By Payment Method</h3>
          <div className="bg-white rounded-2xl border border-border-light divide-y divide-border-light overflow-hidden">
            {Object.entries(byPayment).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-medium">{method}</span>
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-5 mt-7">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Transactions</h3>
        {monthTxs.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">No transactions yet</p>
        ) : (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            {monthTxs.slice(-10).reverse().map(tx => {
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
