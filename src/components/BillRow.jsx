import { store } from '../lib/store'
import { formatCurrency, getDueDateLabel } from '../lib/utils'
import { Check, Circle, AlertCircle } from 'lucide-react'

const categoryColors = {
  giving: '#8b5cf6', housing: '#3b82f6', utilities: '#f59e0b',
  cc: '#6366f1', insurance: '#14b8a6', education: '#ec4899',
  subscriptions: '#f97316',
}

export default function BillRow({ bill }) {
  const dueLabel = getDueDateLabel(bill.dueDay)
  const isPastDue = dueLabel === 'Past due' && !bill.paid
  const color = categoryColors[bill.category] || '#6b7280'

  return (
    <button
      onClick={() => store.toggleBillPaid(bill.id)}
      className="w-full flex items-center gap-4 py-3.5 px-1 transition-all active:bg-surface-2 rounded-xl group"
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
        bill.paid
          ? 'bg-accent text-white'
          : isPastDue
            ? 'border-2 border-danger text-danger'
            : 'border-2 border-border text-transparent group-hover:border-text-tertiary'
      }`}>
        {bill.paid ? <Check size={14} strokeWidth={3} /> : isPastDue ? <AlertCircle size={14} /> : <Circle size={14} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-[15px] ${bill.paid ? 'text-text-tertiary line-through' : ''}`}>
            {bill.name}
          </span>
          {bill.variable && (
            <span className="text-[10px] font-medium text-text-tertiary bg-surface-3 px-1.5 py-0.5 rounded-full">
              EST
            </span>
          )}
        </div>
        <span className={`text-xs ${isPastDue ? 'text-danger font-medium' : 'text-text-tertiary'}`}>
          {dueLabel}
        </span>
      </div>

      <span className={`font-semibold text-[15px] tabular-nums ${bill.paid ? 'text-text-tertiary' : ''}`}>
        {formatCurrency(bill.amount)}
      </span>
    </button>
  )
}
