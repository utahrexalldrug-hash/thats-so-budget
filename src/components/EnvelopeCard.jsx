import { useStore, useEnvelopeSpent } from '../lib/store'
import { formatCurrency, getProgressColor, CATEGORY_ICONS } from '../lib/utils'
import { motion } from 'framer-motion'

export default function EnvelopeCard({ envelope, onClick }) {
  const spent = useEnvelopeSpent(envelope.id)
  const remaining = envelope.budget - spent
  const pct = envelope.budget > 0 ? Math.min(spent / envelope.budget, 1) : 0
  const progressColor = getProgressColor(pct)
  const icon = CATEGORY_ICONS[envelope.icon] || '📁'

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 border border-border-light hover:border-border transition-all duration-200 active:scale-[0.98]"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-[15px]">{envelope.name}</span>
        </div>
        <span className={`text-[15px] font-semibold tabular-nums ${remaining < 0 ? 'text-danger' : ''}`}>
          {formatCurrency(remaining)}
        </span>
      </div>

      <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: progressColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-text-tertiary">
          {formatCurrency(spent)} spent
        </span>
        <span className="text-xs text-text-tertiary">
          {formatCurrency(envelope.budget)} budget
        </span>
      </div>
    </motion.button>
  )
}
