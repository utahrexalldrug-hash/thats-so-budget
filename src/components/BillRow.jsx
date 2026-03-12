import { useStore, isBillPaidForMonth, store } from '../lib/store'
import { formatCurrency, getDueDateLabel, getRecurrenceLabel, isBillActive, PAYMENT_METHODS } from '../lib/utils'
import { Check, Circle, AlertCircle, Pencil, Repeat, Clock } from 'lucide-react'

export default function BillRow({ bill, onEdit }) {
  const data = useStore()
  const paid = isBillPaidForMonth(bill, data.currentMonth)
  const active = isBillActive(bill)
  const dueLabel = getDueDateLabel(bill.dueDay, bill)
  const isPastDue = active && dueLabel.startsWith('Past due') && !paid
  const isNotStarted = !active && !paid
  const recLabel = getRecurrenceLabel(bill.recurrence, bill.frequency)
  const pmLabel = bill.paymentMethod ? (PAYMENT_METHODS.find(p => p.id === bill.paymentMethod)?.short || '') : ''

  return (
    <div className={`flex items-center gap-3 py-3.5 px-1 group ${isNotStarted ? 'opacity-50' : ''}`}>
      <button
        onClick={() => store.toggleBillPaid(bill.id)}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
          paid
            ? 'bg-accent text-white'
            : isNotStarted
              ? 'border-2 border-border text-text-tertiary hover:border-accent'
              : isPastDue
                ? 'border-2 border-danger text-danger'
                : 'border-2 border-border text-transparent group-hover:border-text-tertiary'
        }`}
      >
        {paid ? <Check size={14} strokeWidth={3} /> : isNotStarted ? <Clock size={12} /> : isPastDue ? <AlertCircle size={14} /> : <Circle size={14} />}
      </button>

      <div
        className="flex-1 min-w-0 cursor-pointer active:bg-surface-2 rounded-lg transition-colors"
        onClick={onEdit || (() => store.toggleBillPaid(bill.id))}
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium text-[15px] ${paid ? 'text-text-tertiary line-through' : ''}`}>
            {bill.name}
          </span>
          {bill.variable && (
            <span className="text-[10px] font-medium text-text-tertiary bg-surface-3 px-1.5 py-0.5 rounded-full">
              EST
            </span>
          )}
          {bill.isSubscription && (
            <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
              SUB
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs ${isPastDue ? 'text-danger font-medium' : isNotStarted ? 'text-blue-500 font-medium' : 'text-text-tertiary'}`}>
            {dueLabel}
          </span>
          <span className="text-xs text-text-tertiary flex items-center gap-0.5">
            · <Repeat size={10} /> {recLabel}
          </span>
          {pmLabel && (
            <span className="text-[10px] font-medium text-text-tertiary bg-surface-3 px-1.5 py-0.5 rounded-full">
              {pmLabel}
            </span>
          )}
        </div>
      </div>

      <span className={`font-semibold text-[15px] tabular-nums shrink-0 ${paid ? 'text-text-tertiary' : ''}`}>
        {formatCurrency(bill.amount)}
      </span>

      {onEdit && (
        <button onClick={onEdit} className="p-1.5 rounded-lg text-text-tertiary opacity-40 active:opacity-100 active:bg-surface-2 transition-all shrink-0">
          <Pencil size={14} />
        </button>
      )}
    </div>
  )
}
