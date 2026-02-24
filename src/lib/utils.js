import { format, parseISO, isToday, isTomorrow, addDays, isBefore } from 'date-fns'

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

export function getDueDateLabel(dueDay) {
  const due = getDueDate(dueDay)
  if (isToday(due)) return 'Due today'
  if (isTomorrow(due)) return 'Due tomorrow'
  const now = new Date()
  const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'Past due'
  if (daysUntil <= 7) return `Due in ${daysUntil} days`
  return `Due ${format(due, 'MMM d')}`
}

export function getProgressColor(pct) {
  if (pct >= 0.9) return '#ef4444'
  if (pct >= 0.75) return '#f59e0b'
  return '#0f7b6c'
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
  'shopping-cart': '🛒', 'sparkles': '✨', 'heart': '❤️', 'archive': '📦',
  'user': '👤', 'shirt': '👕', 'tv': '🎬', 'fuel': '⛽',
  'home': '🏠', 'zap': '⚡', 'phone': '📱', 'shield': '🛡️',
  'music': '🎵', 'book': '📖', 'gift': '🎁', 'car': '🚗',
  'plane': '✈️', 'baby': '👶', 'dog': '🐕', 'dollar': '💰',
}
