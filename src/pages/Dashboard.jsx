import { useStore, useTotalIncome, useTotalBills, useTotalSpent } from '../lib/store'
import { formatCurrency, formatCompact, getMonthName, getDueDateLabel } from '../lib/utils'
import EnvelopeCard from '../components/EnvelopeCard'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, ArrowUpRight, ArrowDownRight, Wallet, ChevronRight, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const data = useStore()
  const navigate = useNavigate()
  const totalIncome = useTotalIncome()
  const totalBillsAmount = useTotalBills()
  const totalSpent = useTotalSpent()
  const billsPaid = data.bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0)
  const billsUnpaid = data.bills.filter(b => !b.paid)
  const totalBudgeted = data.envelopes.reduce((s, e) => s + e.budget, 0)
  const remaining = totalIncome - billsPaid - totalSpent

  const upcomingBills = billsUnpaid
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, 3)

  return (
    <div className="min-h-screen pb-24 bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f7b6c] to-[#0a5c51] text-white px-6 pt-14 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/70 text-sm font-medium">{getMonthName(data.currentMonth)}</span>
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={16} />
          </button>
        </div>
        <div className="mt-2">
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Available Balance</span>
          <motion.p
            className="text-4xl font-bold tracking-tight mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {formatCurrency(remaining)}
          </motion.p>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight size={14} className="text-green-300" />
              <span className="text-white/60 text-xs">Income</span>
            </div>
            <p className="text-lg font-semibold">{formatCompact(totalIncome)}</p>
          </div>
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

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <div className="px-5 mt-7">
          <button
            onClick={() => navigate('/bills')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Upcoming Bills</h3>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
          <div className="bg-white rounded-2xl border border-border-light divide-y divide-border-light overflow-hidden">
            {upcomingBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-[15px] font-medium">{bill.name}</p>
                  <p className="text-xs text-text-tertiary">{getDueDateLabel(bill.dueDay)}</p>
                </div>
                <span className="font-semibold text-[15px] tabular-nums">{formatCurrency(bill.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Envelopes Preview */}
      <div className="px-5 mt-7">
        <button
          onClick={() => navigate('/envelopes')}
          className="flex items-center justify-between w-full mb-3"
        >
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Envelopes</h3>
          <ChevronRight size={16} className="text-text-tertiary" />
        </button>
        <div className="space-y-3">
          {data.envelopes.filter(e => e.budget > 0).slice(0, 4).map((env, i) => (
            <motion.div
              key={env.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <EnvelopeCard envelope={env} onClick={() => navigate(`/envelopes/${env.id}`)} />
            </motion.div>
          ))}
        </div>
        {data.envelopes.filter(e => e.budget > 0).length > 4 && (
          <button
            onClick={() => navigate('/envelopes')}
            className="w-full mt-3 py-3 text-sm font-medium text-accent"
          >
            View all {data.envelopes.length} envelopes
          </button>
        )}
      </div>
    </div>
  )
}
