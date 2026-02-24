import { useState } from 'react'
import { useStore, useTotalIncome, store } from '../lib/store'
import { formatCurrency, getMonthName } from '../lib/utils'
import BillRow from '../components/BillRow'
import Modal from '../components/Modal'
import { Plus, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Bills() {
  const data = useStore()
  const totalIncome = useTotalIncome()
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddBill, setShowAddBill] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '' })
  const [billForm, setBillForm] = useState({ name: '', amount: '', dueDay: '', category: 'utilities', variable: false })

  const totalBills = data.bills.reduce((s, b) => s + b.amount, 0)
  const paidTotal = data.bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0)
  const unpaidBills = data.bills.filter(b => !b.paid).sort((a, b) => a.dueDay - b.dueDay)
  const paidBills = data.bills.filter(b => b.paid)
  const afterBills = totalIncome - totalBills

  const submitIncome = (e) => {
    e.preventDefault()
    if (!incomeForm.source || !incomeForm.amount) return
    store.addIncome({ source: incomeForm.source, amount: parseFloat(incomeForm.amount), monthKey: data.currentMonth })
    setIncomeForm({ source: '', amount: '' })
    setShowAddIncome(false)
  }

  const submitBill = (e) => {
    e.preventDefault()
    if (!billForm.name || !billForm.amount || !billForm.dueDay) return
    store.addBill({ name: billForm.name, amount: parseFloat(billForm.amount), dueDay: parseInt(billForm.dueDay), category: billForm.category, variable: billForm.variable, paid: false })
    setBillForm({ name: '', amount: '', dueDay: '', category: 'utilities', variable: false })
    setShowAddBill(false)
  }

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-2">
        <h1 className="text-2xl font-bold">Bills & Income</h1>
        <p className="text-sm text-text-secondary mt-1">{getMonthName(data.currentMonth)}</p>
      </div>

      {/* Income Section */}
      <div className="px-5 mt-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900/60 uppercase tracking-wider">Income</h3>
            <button onClick={() => setShowAddIncome(true)} className="text-blue-600 p-1">
              <Plus size={18} />
            </button>
          </div>
          <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalIncome)}</p>
          {data.income.filter(i => i.monthKey === data.currentMonth).map(inc => (
            <div key={inc.id} className="flex justify-between mt-2 text-sm">
              <span className="text-blue-900/60">{inc.source}</span>
              <span className="font-medium text-blue-900">{formatCurrency(inc.amount)}</span>
            </div>
          ))}
          {totalIncome === 0 && <p className="text-sm text-blue-900/40 mt-2">No income added yet</p>}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl border border-border-light p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-tertiary">After all bills</p>
            <p className={`text-lg font-bold ${afterBills < 0 ? 'text-danger' : 'text-accent'}`}>
              {formatCurrency(afterBills)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-tertiary">Bills total</p>
            <p className="text-lg font-semibold">{formatCurrency(totalBills)}</p>
          </div>
        </div>
      </div>

      {/* Unpaid Bills */}
      {unpaidBills.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Upcoming</h3>
          <div className="bg-white rounded-2xl border border-border-light px-4">
            {unpaidBills.map(bill => (
              <BillRow key={bill.id} bill={bill} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Paid ({formatCurrency(paidTotal)})
          </h3>
          <div className="bg-white rounded-2xl border border-border-light px-4 opacity-60">
            {paidBills.map(bill => (
              <BillRow key={bill.id} bill={bill} />
            ))}
          </div>
        </div>
      )}

      {/* Add Bill Button */}
      <div className="px-5 mt-4">
        <button
          onClick={() => setShowAddBill(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={18} /> Add Bill
        </button>
      </div>

      {/* Add Income Modal */}
      <Modal open={showAddIncome} onClose={() => setShowAddIncome(false)} title="Add Income">
        <form onSubmit={submitIncome} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Source</label>
            <input
              type="text"
              placeholder="e.g. S Income 1"
              value={incomeForm.source}
              onChange={e => setIncomeForm(f => ({ ...f, source: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={incomeForm.amount}
                onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">
            Add Income
          </button>
        </form>
      </Modal>

      {/* Add Bill Modal */}
      <Modal open={showAddBill} onClose={() => setShowAddBill(false)} title="Add Bill">
        <form onSubmit={submitBill} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Name</label>
            <input
              type="text"
              placeholder="e.g. Internet"
              value={billForm.name}
              onChange={e => setBillForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-secondary block mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.amount}
                  onChange={e => setBillForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>
            </div>
            <div className="w-24">
              <label className="text-sm font-medium text-text-secondary block mb-1.5">Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="1"
                value={billForm.dueDay}
                onChange={e => setBillForm(f => ({ ...f, dueDay: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={billForm.variable}
              onChange={e => setBillForm(f => ({ ...f, variable: e.target.checked }))}
              className="w-5 h-5 rounded accent-accent"
            />
            <span className="text-sm text-text-secondary">Variable amount (estimate)</span>
          </label>
          <button type="submit" className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">
            Add Bill
          </button>
        </form>
      </Modal>
    </div>
  )
}
