'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Investment, WeeklyBudget, formatNgn, getWeekStart } from '@/lib/types'
import Link from 'next/link'

const PLATFORM_SUGGESTIONS = ['Bamboo', 'Bitcoin', 'Ethereum', 'Crypto', 'Real estate', 'Other']

export default function InvestmentsPage() {
  const [budget, setBudget] = useState<WeeklyBudget | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [platform, setPlatform] = useState('Bamboo')
  const [customPlatform, setCustomPlatform] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const weekStart = getWeekStart().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: b }, { data: inv }] = await Promise.all([
      supabase.from('weekly_budgets').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
      supabase.from('investments').select('*').eq('user_id', user.id).gte('date', weekStart).order('date', { ascending: false }),
    ])
    setBudget(b as WeeklyBudget | null)
    setInvestments((inv || []) as Investment[])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  const effectivePlatform = platform === 'Other' ? customPlatform : platform
  const totalInvested = investments.reduce((a, i) => a + i.amount_ngn, 0)
  const growthAllocated = budget?.growth_ngn ?? 0
  const remaining = Math.max(growthAllocated - totalInvested, 0)
  const pct = growthAllocated > 0 ? Math.min((totalInvested / growthAllocated) * 100, 100) : 0
  const over = totalInvested > growthAllocated

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!budget || !effectivePlatform) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('investments').insert({
      user_id: user.id, budget_id: budget.id, platform: effectivePlatform,
      amount_ngn: parseFloat(amount), notes, date,
    })
    setAmount(''); setNotes(''); setShowForm(false); setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('investments').delete().eq('id', id)
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

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
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Growth · 25%</p>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, fontWeight: 400, color: 'var(--cream)' }}>Investments</h1>
          </div>
          {budget && (
            <button onClick={() => setShowForm(!showForm)} className="btn-gold" style={{ padding: '0.6rem 1.2rem', fontSize: 13 }}>
              {showForm ? '✕ Cancel' : '+ Log'}
            </button>
          )}
        </div>

        {!budget && (
          <div className="animate-fade-up card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>No budget this week</p>
            <Link href="/budget/new" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: 13, textDecoration: 'none' }}>Create one →</Link>
          </div>
        )}

        {/* Growth bucket summary */}
        {budget && (
          <div className="animate-fade-up stagger-1"
            style={{ background: 'linear-gradient(145deg, rgba(90,155,116,0.12) 0%, rgba(90,155,116,0.04) 100%)',
              border: '1px solid rgba(90,155,116,0.25)', borderRadius: '1.25rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              {[
                { label: 'Allocated', value: formatNgn(growthAllocated), color: 'var(--cream)' },
                { label: 'Invested', value: formatNgn(totalInvested), color: 'var(--sage)' },
                { label: over ? 'Over by' : 'Remaining', value: over ? formatNgn(totalInvested - growthAllocated) : formatNgn(remaining), color: over ? 'var(--err)' : 'var(--cream-dim)' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: s.color, fontWeight: 500 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${pct}%`, background: over ? 'var(--err)' : 'var(--sage)' }} />
            </div>
          </div>
        )}

        {/* Log form */}
        {budget && showForm && (
          <form onSubmit={handleAdd} className="animate-slide-down card" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: 'var(--cream)' }}>Log investment</p>

            {/* Platform pills */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Platform</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {PLATFORM_SUGGESTIONS.map(p => (
                  <button key={p} type="button" onClick={() => setPlatform(p)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 13, fontFamily: 'var(--font-body)',
                      border: `1px solid ${platform === p ? 'var(--gold)' : 'var(--gold-border)'}`,
                      background: platform === p ? 'var(--gold-dim)' : 'transparent',
                      color: platform === p ? 'var(--gold)' : 'var(--cream-dim)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {p}
                  </button>
                ))}
              </div>
              {platform === 'Other' && (
                <input type="text" required value={customPlatform} onChange={e => setCustomPlatform(e.target.value)}
                  placeholder="Platform name (e.g. Cardano, Gold)"
                  className="input-field" style={{ marginTop: 4 }} />
              )}
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

            {/* Notes */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Notes (optional)</p>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. S&P 500 index, quarterly DCA" className="input-field" />
            </div>

            {/* Date */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Date</p>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: '0.875rem', fontSize: 14 }}>Cancel</button>
              <button type="submit" disabled={saving || !effectivePlatform} className="btn-gold" style={{ padding: '0.875rem', fontSize: 14 }}>
                {saving ? 'Saving…' : 'Log'}
              </button>
            </div>
          </form>
        )}

        {/* Investment list */}
        {investments.length === 0 && budget ? (
          <div className="animate-fade-up" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, color: 'var(--muted)', fontStyle: 'italic' }}>Nothing invested yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {investments.map((inv, i) => (
              <div key={inv.id} className={`animate-fade-up card stagger-${Math.min(i + 1, 5)}`}
                style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 3, height: 36, borderRadius: 99, background: 'var(--sage)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cream)', fontWeight: 500 }}>{inv.platform}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(inv.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {inv.notes ? ` · ${inv.notes}` : ''}
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--sage)', fontWeight: 500, flexShrink: 0 }}>
                  {formatNgn(inv.amount_ngn)}
                </p>
                <button onClick={() => handleDelete(inv.id)}
                  style={{ color: 'var(--dimmed)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: 16, lineHeight: 1, flexShrink: 0, transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--err)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--dimmed)')}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
