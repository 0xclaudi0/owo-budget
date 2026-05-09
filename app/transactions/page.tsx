'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction, WeeklyBudget, BudgetCategory, Account, CATEGORY_CONFIG, ACCOUNT_LABELS, formatNgn, getWeekStart } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

const CATEGORIES: BudgetCategory[] = ['essentials', 'growth', 'stability', 'reward']
const ACCOUNTS: Account[] = ['palmpay', 'kuda', 'polaris', 'other']

export default function TransactionsPage() {
  const [budget, setBudget] = useState<WeeklyBudget | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [category, setCategory] = useState<BudgetCategory>('essentials')
  const [account, setAccount] = useState<Account>('palmpay')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const weekStart = getWeekStart().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: b }, { data: tx }] = await Promise.all([
      supabase.from('weekly_budgets').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
      supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', weekStart).order('date', { ascending: false }),
    ])

    setBudget(b as WeeklyBudget | null)
    setTransactions((tx || []) as Transaction[])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!budget) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('transactions').insert({
      user_id: user.id,
      budget_id: budget.id,
      category,
      account,
      amount_ngn: parseFloat(amount),
      description,
      date,
    })

    setAmount('')
    setDescription('')
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const spentByCategory: Record<BudgetCategory, number> = { essentials: 0, growth: 0, stability: 0, reward: 0 }
  transactions.forEach(tx => { spentByCategory[tx.category] += tx.amount_ngn })

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-400">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">Transactions</h1>
          {budget && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {!budget && (
          <div className="text-center py-12 text-gray-400">
            <p>No budget for this week yet.</p>
            <a href="/budget/new" className="text-emerald-400 mt-2 inline-block">Create one →</a>
          </div>
        )}

        {budget && showForm && (
          <form onSubmit={handleAdd} className="bg-gray-800 rounded-2xl p-4 mb-5 space-y-4">
            <h3 className="text-white font-semibold">Add transaction</h3>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => {
                  const cfg = CATEGORY_CONFIG[cat]
                  const allocated = budget[`${cat}_ngn` as keyof WeeklyBudget] as number
                  const spent = spentByCategory[cat]
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2 rounded-xl border-2 text-left transition-colors ${
                        category === cat ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700'
                      }`}
                    >
                      <p className={`text-sm font-medium ${category === cat ? 'text-emerald-400' : 'text-white'}`}>{cfg.label}</p>
                      <p className="text-xs text-gray-400">{formatNgn(allocated - spent)} left</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Account</label>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNTS.map(acc => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setAccount(acc)}
                    className={`p-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                      account === acc ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-gray-700 text-white'
                    }`}
                  >
                    {ACCOUNT_LABELS[acc]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (₦)</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-lg font-bold"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Grocery run"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-medium">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {transactions.length === 0 && budget ? (
          <p className="text-center text-gray-500 py-8">No transactions yet this week.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const cfg = CATEGORY_CONFIG[tx.category]
              return (
                <div key={tx.id} className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${cfg.bg} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{tx.description || cfg.label}</p>
                    <p className="text-gray-400 text-xs">{ACCOUNT_LABELS[tx.account as Account]} · {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatNgn(tx.amount_ngn)}</p>
                    <p className={`text-xs ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <button onClick={() => handleDelete(tx.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1 flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
