import { format, isToday, isTomorrow } from 'date-fns'

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatCompact(amount) {
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }
  return formatCurrency(amount)
}

export function getMonthName(monthKey) {
  const [y, m] = monthKey.split('-')
  return format(new Date(parseInt(y), parseInt(m) - 1, 1), 'MMMM yyyy')
}

export function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getDueDate(dueDay) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), dueDay)
}

export function getDueDateLabel(dueDay, bill) {
  // If the bill has a startDate and it's in the future, show "Starts on" instead
  if (bill?.startDate) {
    const start = new Date(bill.startDate + 'T00:00:00')
    const now = new Date()
    if (start > now) {
      return `Starts ${format(start, 'MMM d, yyyy')}`
    }
  }

  const due = getDueDate(dueDay)
  if (isToday(due)) return 'Due today'
  if (isTomorrow(due)) return 'Due tomorrow'
  const now = new Date()
  const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) {
    const daysLate = Math.abs(daysUntil)
    return `Past due (${format(due, 'MMM d')} · ${daysLate}d late)`
  }
  if (daysUntil <= 7) return `Due in ${daysUntil} days · ${format(due, 'MMM d')}`
  return `Due ${format(due, 'MMM d')}`
}

export function isBillActive(bill) {
  // If no startDate, bill is always active (backward compatible)
  if (!bill.startDate) return true
  const start = new Date(bill.startDate + 'T00:00:00')
  const now = new Date()
  return start <= now
}

export function getFrequencyLabel(frequency) {
  if (!frequency || frequency === 'monthly') return 'Monthly'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'biweekly') return 'Every 2 weeks'
  return frequency
}

export function getRecurrenceLabel(recurrence, frequency) {
  const freqLabel = getFrequencyLabel(frequency)
  if (!recurrence || recurrence === 'indefinite') return freqLabel
  if (recurrence === 'once') return 'One-time'
  return `${recurrence}x remaining · ${freqLabel}`
}

export function getProgressColor(pct) {
  if (pct >= 0.9) return '#ef4444'
  if (pct >= 0.75) return '#f59e0b'
  return '#0f7b6c'
}

export function getPrevMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getNextMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const PAYMENT_METHODS = [
  { id: 'scc', label: 'S Credit Card', short: 'SCC' },
  { id: 'kcc', label: 'K Credit Card', short: 'KCC' },
  { id: 'debit', label: 'Debit Card', short: 'Debit' },
  { id: 'cash', label: 'Cash', short: 'Cash' },
]

export const CATEGORY_ICONS = {
  // Original
  'shopping-cart': '🛒', 'sparkles': '✨', 'heart': '❤️', 'archive': '📦',
  'user': '👤', 'shirt': '👕', 'tv': '🎬', 'fuel': '⛽',
  'home': '🏠', 'zap': '⚡', 'phone': '📱', 'shield': '🛡️',
  'music': '🎵', 'book': '📖', 'gift': '🎁', 'car': '🚗',
  'plane': '✈️', 'baby': '👶', 'dog': '🐕', 'dollar': '💰',
  // Food & Drink
  'apple': '🍎', 'pizza': '🍕', 'coffee': '☕', 'utensils': '🍽️',
  // Health & Fitness
  'pill': '💊', 'gym': '🏋️', 'tooth': '🦷', 'stethoscope': '🩺',
  // Family & Life
  'family': '👨‍👩‍👧‍👦', 'school': '🎓', 'church': '⛪', 'ring': '💍',
  // Money & Work
  'briefcase': '💼', 'chart': '📈', 'bank': '🏦', 'piggy': '🐷',
  // Fun & Hobbies
  'game': '🎮', 'palette': '🎨', 'camera': '📸', 'soccer': '⚽',
  'bicycle': '🚲', 'tent': '⛺', 'tree': '🌲', 'sun': '☀️',
  // Home & Maintenance
  'wrench': '🔧', 'broom': '🧹', 'soap': '🧴', 'bed': '🛏️',
  // Pets
  'cat': '🐱', 'paw': '🐾', 'fish': '🐟',
  // Misc
  'star': '⭐', 'fire': '🔥', 'rocket': '🚀', 'tag': '🏷️',
  'scissors': '✂️', 'computer': '💻', 'mail': '📬', 'globe': '🌎',
  'toilet': '🚽',
}
