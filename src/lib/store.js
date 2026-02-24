import { useState, useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'tsb_data'

function getDefaultData() {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return {
    currentMonth: monthKey,
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

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return getDefaultData()
}

let data = loadData()
let listeners = new Set()

function emitChange() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  listeners.forEach(l => l())
}

export const store = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() { return data },
  getData() { return data },

  update(fn) {
    data = { ...data, ...fn(data) }
    emitChange()
  },

  addTransaction(tx) {
    data = { ...data, transactions: [...data.transactions, { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }
    emitChange()
  },

  deleteTransaction(id) {
    data = { ...data, transactions: data.transactions.filter(t => t.id !== id) }
    emitChange()
  },

  updateTransaction(id, updates) {
    data = { ...data, transactions: data.transactions.map(t => t.id === id ? { ...t, ...updates } : t) }
    emitChange()
  },

  addIncome(inc) {
    data = { ...data, income: [...data.income, { ...inc, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }
    emitChange()
  },

  toggleBillPaid(billId) {
    data = {
      ...data,
      bills: data.bills.map(b => b.id === billId ? { ...b, paid: !b.paid } : b)
    }
    emitChange()
  },

  updateBillAmount(billId, amount) {
    data = {
      ...data,
      bills: data.bills.map(b => b.id === billId ? { ...b, amount } : b)
    }
    emitChange()
  },

  addBill(bill) {
    data = { ...data, bills: [...data.bills, { ...bill, id: crypto.randomUUID() }] }
    emitChange()
  },

  addEnvelope(env) {
    data = { ...data, envelopes: [...data.envelopes, { ...env, id: crypto.randomUUID() }] }
    emitChange()
  },

  updateEnvelope(id, updates) {
    data = { ...data, envelopes: data.envelopes.map(e => e.id === id ? { ...e, ...updates } : e) }
    emitChange()
  },

  resetData() {
    data = getDefaultData()
    emitChange()
  },
}

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
