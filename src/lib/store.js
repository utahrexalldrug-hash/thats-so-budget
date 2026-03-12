import { useSyncExternalStore } from 'react'
import { db, auth } from './firebase'
import {
  doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, getDocs, writeBatch
} from 'firebase/firestore'

const STORAGE_KEY = 'tsb_data'

function getDefaultMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getDefaultData() {
  return {
    currentMonth: getDefaultMonth(),
    profile: { name1: 'S', name2: 'K' },
    envelopes: [
      { id: 'food', name: 'Food / Toiletries', budget: 3200, color: '#0f7b6c', icon: 'shopping-cart' },
      { id: 'cleaning', name: 'Cleaning', budget: 0, color: '#6366f1', icon: 'sparkles' },
      { id: 'toiletries', name: 'Toiletries', budget: 0, color: '#8b5cf6', icon: 'heart' },
      { id: 'food-storage', name: 'Food Storage', budget: 200, color: '#f59e0b', icon: 'archive' },
      { id: 'k-money', name: 'K Money', budget: 100, color: '#3b82f6', icon: 'user' },
      { id: 's-money', name: 'S Money', budget: 100, color: '#ec4899', icon: 'user' },
      { id: 'clothing', name: 'Clothing', budget: 300, color: '#14b8a6', icon: 'shirt' },
      { id: 'entertainment', name: 'Family Entertainment', budget: 250, color: '#f97316', icon: 'tv' },
      { id: 'dates', name: 'Dates', budget: 200, color: '#e11d48', icon: 'heart' },
      { id: 'gas', name: 'Gas', budget: 300, color: '#64748b', icon: 'fuel' },
    ],
    bills: [
      { id: 'tithing', name: 'Tithing', amount: 710, dueDay: 1, category: 'giving', paid: false },
      { id: 'fast-offerings', name: 'Fast Offerings', amount: 200, dueDay: 1, category: 'giving', paid: false },
      { id: 'mortgage', name: 'Mortgage', amount: 2002.06, dueDay: 1, category: 'housing', paid: false },
      { id: 'rmp', name: 'RMP (Power)', amount: 185.71, dueDay: 3, category: 'utilities', variable: true, paid: false },
      { id: 'phone', name: 'Phone Bill', amount: 247.39, dueDay: 11, category: 'utilities', paid: false },
      { id: 'scc', name: 'S Credit Card', amount: 0, dueDay: 12, category: 'cc', variable: true, paid: false },
      { id: 'kcc', name: 'K Credit Card', amount: 0, dueDay: 16, category: 'cc', variable: true, paid: false },
      { id: 'insurance', name: 'Health/Life Insurance', amount: 92, dueDay: 1, category: 'insurance', paid: false },
      { id: 'piano', name: 'Piano Lessons', amount: 65, dueDay: 1, category: 'education', paid: false },
      { id: 'pandora', name: 'Pandora', amount: 19.99, dueDay: 1, category: 'subscriptions', paid: false },
    ],
    income: [],
    transactions: [],
    debts: [],
    sinkingFunds: [],
    months: {},
  }
}

// --- Local state (works without auth, syncs with Firestore when logged in) ---

let data = loadLocalData()
let listeners = new Set()
let unsubFirestore = null
let currentUserId = null

function fixMonthKeys(parsed) {
  // Fix transactions whose monthKey doesn't match their actual date
  if (parsed.transactions) {
    parsed.transactions = parsed.transactions.map(t => {
      const dateStr = t.date || t.createdAt?.split('T')[0]
      if (dateStr) {
        const correctMonth = dateStr.slice(0, 7)
        if (t.monthKey !== correctMonth) {
          return { ...t, monthKey: correctMonth }
        }
      }
      return t
    })
  }
  // Fix income items similarly
  if (parsed.income) {
    parsed.income = parsed.income.map(i => {
      const dateStr = i.createdAt?.split('T')[0]
      if (dateStr) {
        const correctMonth = dateStr.slice(0, 7)
        if (i.monthKey !== correctMonth) {
          return { ...i, monthKey: correctMonth }
        }
      }
      return i
    })
  }
  return parsed
}

function loadLocalData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Always reset to current month on fresh page load
      parsed.currentMonth = getDefaultMonth()
      // Fix any mismatched monthKeys from the old bug
      fixMonthKeys(parsed)
      return parsed
    }
  } catch { /* empty */ }
  return getDefaultData()
}

function emitChange() {
  // Always persist locally as backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  listeners.forEach(l => l())
}

// --- Firestore sync ---

function householdRef(uid) {
  return doc(db, 'households', uid)
}

function startFirestoreSync(uid) {
  if (unsubFirestore) unsubFirestore()
  currentUserId = uid

  unsubFirestore = onSnapshot(householdRef(uid), (snap) => {
    if (snap.exists()) {
      const remote = snap.data()
      // Merge remote data but keep local currentMonth navigation
      data = fixMonthKeys({
        ...remote,
        currentMonth: data.currentMonth || remote.currentMonth || getDefaultMonth(),
      })
      emitChange()
    }
  }, (err) => {
    console.warn('Firestore sync error:', err)
  })
}

function stopFirestoreSync() {
  if (unsubFirestore) {
    unsubFirestore()
    unsubFirestore = null
  }
  currentUserId = null
}

async function saveToFirestore() {
  if (!currentUserId) return
  try {
    const toSave = { ...data }
    // Don't persist currentMonth to Firestore (it's a local UI concern)
    delete toSave.currentMonth
    await setDoc(householdRef(currentUserId), toSave, { merge: true })
  } catch (err) {
    console.warn('Firestore save error:', err)
  }
}

async function initializeHousehold(uid) {
  const snap = await getDocs(query(collection(db, 'households'), where('__name__', '==', uid)))
  if (snap.empty) {
    // First time — push current local data to Firestore
    const toSave = { ...data }
    delete toSave.currentMonth
    await setDoc(householdRef(uid), toSave)
  }
}

// --- Public store API (unchanged interface for all components) ---

export const store = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() { return data },
  getData() { return data },

  // Auth integration
  onLogin(uid) {
    initializeHousehold(uid).then(() => startFirestoreSync(uid))
  },
  onLogout() {
    stopFirestoreSync()
  },
  isOnline() {
    return !!currentUserId
  },

  update(fn) {
    data = { ...data, ...fn(data) }
    emitChange()
    saveToFirestore()
  },

  addTransaction(tx) {
    data = { ...data, transactions: [...data.transactions, { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }
    emitChange()
    saveToFirestore()
  },

  deleteTransaction(id) {
    data = { ...data, transactions: data.transactions.filter(t => t.id !== id) }
    emitChange()
    saveToFirestore()
  },

  updateTransaction(id, updates) {
    data = { ...data, transactions: data.transactions.map(t => t.id === id ? { ...t, ...updates } : t) }
    emitChange()
    saveToFirestore()
  },

  addIncome(inc) {
    data = { ...data, income: [...data.income, { ...inc, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }
    emitChange()
    saveToFirestore()
  },

  deleteIncome(id) {
    data = { ...data, income: data.income.filter(i => i.id !== id) }
    emitChange()
    saveToFirestore()
  },

  updateIncome(id, updates) {
    data = { ...data, income: data.income.map(i => i.id === id ? { ...i, ...updates } : i) }
    emitChange()
    saveToFirestore()
  },

  toggleBillPaid(billId) {
    const month = data.currentMonth
    data = {
      ...data,
      bills: data.bills.map(b => {
        if (b.id !== billId) return b
        // If already paid for this month, unpay it; otherwise mark paid for this month
        const isPaidThisMonth = b.paidForMonth === month
        return { ...b, paid: !isPaidThisMonth, paidForMonth: isPaidThisMonth ? null : month }
      })
    }
    emitChange()
    saveToFirestore()
  },

  updateBillAmount(billId, amount) {
    data = {
      ...data,
      bills: data.bills.map(b => b.id === billId ? { ...b, amount } : b)
    }
    emitChange()
    saveToFirestore()
  },

  addBill(bill) {
    data = { ...data, bills: [...data.bills, { ...bill, id: crypto.randomUUID() }] }
    emitChange()
    saveToFirestore()
  },

  deleteBill(id) {
    data = { ...data, bills: data.bills.filter(b => b.id !== id) }
    emitChange()
    saveToFirestore()
  },

  updateBill(id, updates) {
    data = { ...data, bills: data.bills.map(b => b.id === id ? { ...b, ...updates } : b) }
    emitChange()
    saveToFirestore()
  },

  addEnvelope(env) {
    data = { ...data, envelopes: [...data.envelopes, { ...env, id: crypto.randomUUID() }] }
    emitChange()
    saveToFirestore()
  },

  updateEnvelope(id, updates) {
    data = { ...data, envelopes: data.envelopes.map(e => e.id === id ? { ...e, ...updates } : e) }
    emitChange()
    saveToFirestore()
  },

  deleteEnvelope(id) {
    data = { ...data, envelopes: data.envelopes.filter(e => e.id !== id) }
    emitChange()
    saveToFirestore()
  },

  // Debts
  addDebt(debt) {
    data = { ...data, debts: [...data.debts, { ...debt, id: crypto.randomUUID(), payments: [], createdAt: new Date().toISOString() }] }
    emitChange()
    saveToFirestore()
  },

  updateDebt(id, updates) {
    data = { ...data, debts: data.debts.map(d => d.id === id ? { ...d, ...updates } : d) }
    emitChange()
    saveToFirestore()
  },

  deleteDebt(id) {
    data = { ...data, debts: data.debts.filter(d => d.id !== id) }
    emitChange()
    saveToFirestore()
  },

  addDebtPayment(debtId, payment) {
    data = {
      ...data,
      debts: data.debts.map(d => {
        if (d.id !== debtId) return d
        const newPayment = { ...payment, id: crypto.randomUUID(), date: new Date().toISOString() }
        const newBalance = Math.max(0, d.balance - payment.amount)
        return { ...d, balance: newBalance, payments: [...(d.payments || []), newPayment] }
      })
    }
    emitChange()
    saveToFirestore()
  },

  deleteDebtPayment(debtId, paymentId) {
    data = {
      ...data,
      debts: data.debts.map(d => {
        if (d.id !== debtId) return d
        const payment = (d.payments || []).find(p => p.id === paymentId)
        const restoredBalance = payment ? d.balance + payment.amount : d.balance
        return { ...d, balance: restoredBalance, payments: (d.payments || []).filter(p => p.id !== paymentId) }
      })
    }
    emitChange()
    saveToFirestore()
  },

  setMonth(monthKey) {
    data = { ...data, currentMonth: monthKey }
    emitChange()
    // Don't save currentMonth to Firestore — it's local nav state
  },

  resetData() {
    data = getDefaultData()
    emitChange()
    saveToFirestore()
  },
}

// --- Helpers ---

// Check if a bill is paid for a given month
export function isBillPaidForMonth(bill, monthKey) {
  return bill.paidForMonth === monthKey || (bill.paid && !bill.paidForMonth)
}

// --- Hooks ---

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

export function useEnvelopeSpent(envelopeId, monthKey) {
  const data = useStore()
  const txs = data.transactions.filter(t => t.envelopeId === envelopeId && t.monthKey === (monthKey || data.currentMonth))
  return txs.reduce((sum, t) => sum + (t.type === 'refund' ? -t.amount : t.amount), 0)
}

export function useMonthTransactions(monthKey) {
  const data = useStore()
  return data.transactions.filter(t => t.monthKey === (monthKey || data.currentMonth))
}

export function useTotalIncome(monthKey) {
  const data = useStore()
  return data.income
    .filter(i => i.monthKey === (monthKey || data.currentMonth))
    .reduce((sum, i) => sum + i.amount, 0)
}

export function useTotalBills() {
  const data = useStore()
  return data.bills.reduce((sum, b) => sum + b.amount, 0)
}

export function useTotalSpent(monthKey) {
  const data = useStore()
  return data.transactions
    .filter(t => t.monthKey === (monthKey || data.currentMonth))
    .reduce((sum, t) => sum + (t.type === 'refund' ? -t.amount : t.amount), 0)
}
