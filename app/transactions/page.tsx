'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction, WeeklyBudget, BudgetCategory, Account, CATEGORY_CONFIG, ACCOUNT_LABELS, formatNgn, getWeekStart } from '@/lib/types'
import Link from 'next/link'

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
      user_id: user.id, budget_id: budget.id, category, account,
      amount_ngn: parseFloat(amount), description, date,
    })
    setAmount(''); setDescription(''); setShowForm(false); setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const spentByCategory: Record<BudgetCategory, number> = { essentials: 0, growth: 0, stability: 0, reward: 0 }
  transactions.forEach(tx => { spentByCategory[tx.category] += tx.amount_ngn })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em' }}>LOADING…</span>
    </div>
  )

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="animate-fade-up flex justify-between items-center mb-8">
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Spending</p>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, fontWeight: 400, color: 'var(--cream)' }}>Transactions</h1>
          </div>
          {budget && (
            <button onClick={() => setShowForm(!showForm)}
              className="btn-gold" style={{ padding: '0.6rem 1.2rem', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              {showForm ? '✕ Cancel' : '+ Add'}
            </button>
          )}
        </div>

        {!budget && (
          <div className="animate-fade-up card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>No budget this week</p>
            <Link href="/budget/new" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: 13, textDecoration: 'none' }}>Create one →</Link>
          </div>
        )}

        {/* Add form */}
        {budget && showForm && (
          <form onSubmit={handleAdd} className="animate-slide-down card" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: 'var(--cream)', fontWeight: 400 }}>Add transaction</p>

            {/* Category */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Category</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(cat => {
                  const cfg = CATEGORY_CONFIG[cat]
                  const allocated = budget[`${cat}_ngn` as keyof WeeklyBudget] as number
                  const spent = spentByCategory[cat]
                  return (
                    <button key={cat} type="button" onClick={() => setCategory(cat)}
                      className={`pill-option ${category === cat ? 'active' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.hex, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: category === cat ? 'var(--gold)' : 'var(--cream)' }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', paddingLeft: 14 }}>
                        {formatNgn(allocated - spent)} left
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Account */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Account</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ACCOUNTS.map(acc => (
                  <button key={acc} type="button" onClick={() => setAccount(acc)}
                    className={`pill-option ${account === acc ? 'active' : ''}`}
                    style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: account === acc ? 'var(--gold)' : 'var(--cream)' }}>
                      {ACCOUNT_LABELS[acc]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Amount (₦)</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, background: 'var(--bg-input)', borderRadius: '0.875rem', padding: '0.875rem 1rem', border: '1px solid var(--gold-border)' }}>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: 'var(--muted)' }}>₦</span>
                <input type="number" min="1" step="1" required value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 300, color: 'var(--cream)', width: '100%' }} />
              </div>
            </div>

            {/* Description */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Description</p>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Grocery run, Airtime"
                className="input-field" />
            </div>

            {/* Date */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Date</p>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: '0.875rem', fontSize: 14 }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-gold" style={{ padding: '0.875rem', fontSize: 14 }}>{saving ? 'Saving…' : 'Add'}</button>
            </div>
          </form>
        )}

        {/* Transaction list */}
        {transactions.length === 0 && budget ? (
          <div className="animate-fade-up" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: 'var(--muted)', fontStyle: 'italic' }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map((tx, i) => {
              const cfg = CATEGORY_CONFIG[tx.category]
              return (
                <div key={tx.id} className={`animate-fade-up card stagger-${Math.min(i + 1, 5)}`}
                  style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 3, height: 36, borderRadius: 99, background: cfg.hex, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || cfg.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {ACCOUNT_LABELS[tx.account as Account]} · {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--cream)', fontWeight: 500 }}>{formatNgn(tx.amount_ngn)}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: cfg.hex, marginTop: 2 }}>{cfg.label}</p>
                  </div>
                  <button onClick={() => handleDelete(tx.id)}
                    style={{ color: 'var(--dimmed)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: 16, lineHeight: 1, flexShrink: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--err)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--dimmed)')}>
                    ×
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
