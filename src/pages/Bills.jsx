import { useState } from 'react'
import { useStore, isBillPaidForMonth, store } from '../lib/store'
import { formatCurrency, getMonthName, PAYMENT_METHODS } from '../lib/utils'
import BillRow from '../components/BillRow'
import Modal from '../components/Modal'
import { Plus, Trash2, X, CreditCard } from 'lucide-react'

const RECURRENCE_OPTIONS = [
  { value: 'indefinite', label: 'Ongoing (forever)' },
  { value: 'once', label: 'One-time only' },
  { value: '3', label: '3 times' },
  { value: '6', label: '6 times' },
  { value: '12', label: '12 times' },
]

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'weekly', label: 'Weekly' },
]

const DEFAULT_CATEGORIES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'housing', label: 'Housing' },
  { value: 'giving', label: 'Giving' },
  { value: 'cc', label: 'Credit Card' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'education', label: 'Education' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'other', label: 'Other' },
]

const defaultBillForm = { name: '', amount: '', dueDay: '', category: 'utilities', variable: false, isSubscription: false, recurrence: 'indefinite', frequency: 'monthly', startDate: '', paymentMethod: 'debit' }

function BillFormFields({ form, setForm, allCategories }) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">Name</label>
        <input
          type="text"
          placeholder="e.g. Internet"
          value={form.name || ''}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
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
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
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
            value={form.dueDay || ''}
            onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
          />
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">
          Start Date <span className="text-text-tertiary font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={form.startDate || ''}
          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
        />
        <p className="text-xs text-text-tertiary mt-1">Bill won't show as due until this date. Leave blank if already active.</p>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">Category</label>
        <select
          value={form.category || 'utilities'}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
        >
          {allCategories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">Pay With</label>
        <div className="flex gap-2">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, paymentMethod: pm.id }))}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                form.paymentMethod === pm.id
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border-light text-text-secondary'
              }`}
            >
              {pm.short}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">Frequency</label>
        <div className="flex gap-2">
          {FREQUENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, frequency: opt.value }))}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                form.frequency === opt.value
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border-light text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-1.5">How long</label>
        <div className="grid grid-cols-2 gap-2">
          {RECURRENCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, recurrence: opt.value }))}
              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                form.recurrence === opt.value
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border-light text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          checked={form.variable || false}
          onChange={e => setForm(f => ({ ...f, variable: e.target.checked }))}
          className="w-5 h-5 rounded accent-accent"
        />
        <span className="text-sm text-text-secondary">Variable amount (estimate — update when real bill arrives)</span>
      </label>
      <label className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          checked={form.isSubscription || false}
          onChange={e => setForm(f => ({ ...f, isSubscription: e.target.checked }))}
          className="w-5 h-5 rounded accent-accent"
        />
        <span className="text-sm text-text-secondary">Subscription (recurring service you can cancel)</span>
      </label>
    </>
  )
}

export default function Bills() {
  const data = useStore()
  const [showAddBill, setShowAddBill] = useState(false)
  const [showEditBill, setShowEditBill] = useState(null)
  const [billForm, setBillForm] = useState({ ...defaultBillForm })
  const [editBillForm, setEditBillForm] = useState({})
  const [confirmDeleteBill, setConfirmDeleteBill] = useState(null)
  const [showCategoryEditor, setShowCategoryEditor] = useState(false)
  const [newCategoryLabel, setNewCategoryLabel] = useState('')

  // Custom categories stored in data, merged with defaults
  const customCategories = data.billCategories || []
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]

  const addCustomCategory = () => {
    if (!newCategoryLabel.trim()) return
    const value = newCategoryLabel.trim().toLowerCase().replace(/\s+/g, '-')
    if (allCategories.some(c => c.value === value)) return
    store.update(d => ({ billCategories: [...(d.billCategories || []), { value, label: newCategoryLabel.trim() }] }))
    setNewCategoryLabel('')
  }

  const deleteCustomCategory = (value) => {
    store.update(d => ({ billCategories: (d.billCategories || []).filter(c => c.value !== value) }))
  }

  const month = data.currentMonth
  const totalBills = data.bills.reduce((s, b) => s + b.amount, 0)
  const paidBillsList = data.bills.filter(b => isBillPaidForMonth(b, month))
  const paidTotal = paidBillsList.reduce((s, b) => s + b.amount, 0)
  const unpaidBills = data.bills.filter(b => !isBillPaidForMonth(b, month)).sort((a, b) => a.dueDay - b.dueDay)
  const paidBills = paidBillsList
  const unpaidTotal = totalBills - paidTotal

  // Sum paid bills by card
  const paidByCard = PAYMENT_METHODS.map(pm => ({
    ...pm,
    total: paidBillsList.filter(b => (b.paymentMethod || 'debit') === pm.id).reduce((s, b) => s + b.amount, 0),
  })).filter(pm => pm.total > 0)

  const submitBill = (e) => {
    e.preventDefault()
    if (!billForm.name || !billForm.amount || !billForm.dueDay) return
    store.addBill({
      name: billForm.name,
      amount: parseFloat(billForm.amount),
      dueDay: parseInt(billForm.dueDay),
      category: billForm.category,
      variable: billForm.variable,
      isSubscription: billForm.isSubscription,
      recurrence: billForm.recurrence,
      frequency: billForm.frequency,
      startDate: billForm.startDate || null,
      paymentMethod: billForm.paymentMethod || 'debit',
      paid: false,
    })
    setBillForm({ ...defaultBillForm })
    setShowAddBill(false)
  }

  const openEditBill = (bill) => {
    setEditBillForm({
      name: bill.name,
      amount: String(bill.amount),
      dueDay: String(bill.dueDay),
      category: bill.category || 'utilities',
      variable: !!bill.variable,
      isSubscription: !!bill.isSubscription,
      recurrence: bill.recurrence || 'indefinite',
      frequency: bill.frequency || 'monthly',
      startDate: bill.startDate || '',
      paymentMethod: bill.paymentMethod || 'debit',
    })
    setShowEditBill(bill.id)
    setConfirmDeleteBill(null)
  }

  const saveEditBill = () => {
    if (!editBillForm.name || !editBillForm.amount || !editBillForm.dueDay) return
    store.updateBill(showEditBill, {
      name: editBillForm.name,
      amount: parseFloat(editBillForm.amount),
      dueDay: parseInt(editBillForm.dueDay),
      category: editBillForm.category,
      variable: editBillForm.variable,
      isSubscription: editBillForm.isSubscription,
      recurrence: editBillForm.recurrence,
      frequency: editBillForm.frequency,
      startDate: editBillForm.startDate || null,
      paymentMethod: editBillForm.paymentMethod || 'debit',
    })
    setShowEditBill(null)
  }

  // BillFormFields is now defined outside this component to prevent remounting on every keystroke

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="px-6 pt-14 pb-2">
        <h1 className="text-2xl font-bold">Bills & Expenses</h1>
        <p className="text-sm text-text-secondary mt-1">{getMonthName(data.currentMonth)}</p>
      </div>

      {/* Summary */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl border border-border-light p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary">Remaining unpaid</p>
              <p className={`text-lg font-bold ${unpaidTotal > 0 ? 'text-amber-600' : 'text-accent'}`}>
                {formatCurrency(unpaidTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary">Bills total</p>
              <p className="text-lg font-semibold">{formatCurrency(totalBills)}</p>
            </div>
          </div>
          {paidByCard.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light flex flex-wrap gap-3">
              {paidByCard.map(pm => (
                <div key={pm.id} className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-text-tertiary" />
                  <span className="text-xs font-medium text-text-secondary">{pm.short}:</span>
                  <span className="text-xs font-semibold text-accent">{formatCurrency(pm.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unpaid Bills */}
      {unpaidBills.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Upcoming</h3>
          <div className="bg-white rounded-2xl border border-border-light px-4">
            {unpaidBills.map(bill => (
              <BillRow key={bill.id} bill={bill} onEdit={() => openEditBill(bill)} />
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
              <BillRow key={bill.id} bill={bill} onEdit={() => openEditBill(bill)} />
            ))}
          </div>
        </div>
      )}

      {/* Add Bill + Edit Categories */}
      <div className="px-5 mt-4 space-y-2">
        <button
          onClick={() => setShowAddBill(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={18} /> Add Bill
        </button>
        <button
          onClick={() => setShowCategoryEditor(true)}
          className="w-full py-2.5 text-xs font-medium text-text-tertiary active:text-accent transition-colors"
        >
          Edit Bill Categories
        </button>
      </div>

      {/* Add Bill Modal */}
      <Modal open={showAddBill} onClose={() => setShowAddBill(false)} title="Add Bill">
        <form onSubmit={submitBill} className="space-y-4">
          <BillFormFields form={billForm} setForm={setBillForm} allCategories={allCategories} />
          <button type="submit" className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">Add Bill</button>
        </form>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal open={!!showEditBill} onClose={() => { setShowEditBill(null); setConfirmDeleteBill(null) }} title="Edit Bill">
        <div className="space-y-4">
          <BillFormFields form={editBillForm} setForm={setEditBillForm} allCategories={allCategories} />
          <button onClick={saveEditBill} className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors">Save Changes</button>

          <div className="pt-2 border-t border-border-light">
            {confirmDeleteBill !== showEditBill ? (
              <button onClick={() => setConfirmDeleteBill(showEditBill)} className="w-full py-3 text-sm font-medium text-danger flex items-center justify-center gap-1.5">
                <Trash2 size={14} /> Delete Bill
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-text-secondary">Are you sure you want to delete this bill?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDeleteBill(null)} className="flex-1 py-2.5 rounded-xl border border-border-light text-sm font-medium text-text-secondary">Cancel</button>
                  <button onClick={() => { store.deleteBill(showEditBill); setShowEditBill(null); setConfirmDeleteBill(null) }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium active:bg-red-600">Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Category Editor Modal */}
      <Modal open={showCategoryEditor} onClose={() => setShowCategoryEditor(false)} title="Bill Categories">
        <div className="space-y-4">
          <p className="text-sm text-text-tertiary">Default categories can't be removed. Add your own below.</p>
          <div className="space-y-1.5">
            {DEFAULT_CATEGORIES.map(c => (
              <div key={c.value} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-2">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-[10px] text-text-tertiary">Default</span>
              </div>
            ))}
            {customCategories.map(c => (
              <div key={c.value} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-2">
                <span className="text-sm font-medium">{c.label}</span>
                <button onClick={() => deleteCustomCategory(c.value)} className="p-1 text-text-tertiary active:text-danger transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryLabel}
              onChange={e => setNewCategoryLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-2 border border-border-light focus:border-accent outline-none text-sm"
            />
            <button onClick={addCustomCategory} className="px-4 py-3 bg-accent text-white rounded-xl text-sm font-medium active:bg-accent-dark">
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
