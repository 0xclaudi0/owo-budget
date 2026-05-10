'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WithdrawalMethod, calcBudget, formatNgn, formatUsd, getWeekStart, formatWeekLabel } from '@/lib/types'
import Link from 'next/link'

export default function NewBudgetPage() {
  const router = useRouter()
  const [incomeUsd, setIncomeUsd] = useState('')
  const [method, setMethod] = useState<WithdrawalMethod>('payoneer_naira')
  const [rate, setRate] = useState('')
  const [marketRate, setMarketRate] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')

  const weekStart = getWeekStart().toISOString().split('T')[0]
  const parsedIncome = parseFloat(incomeUsd) || 0
  const parsedRate = parseFloat(rate) || 0
  const preview = parsedIncome > 0 && parsedRate > 0 ? calcBudget(parsedIncome, method, parsedRate) : null

  useEffect(() => { fetchMarketRate() }, [])

  async function fetchMarketRate() {
    setRateLoading(true)
    try {
      const res = await fetch('/api/rate')
      const data = await res.json()
      if (data.rate) { setMarketRate(data.rate); if (!rate) setRate(Math.round(data.rate).toString()) }
    } catch {}
    setRateLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsedIncome || !parsedRate) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const calc = calcBudget(parsedIncome, method, parsedRate)
    const { error: err } = await supabase.from('weekly_budgets').upsert({
      user_id: user.id, week_start: weekStart, income_usd: parsedIncome,
      withdrawal_method: method, exchange_rate: parsedRate, notes, ...calc,
    }, { onConflict: 'user_id,week_start' })

    if (err) { setError(err.message); setSaving(false) } else { router.push('/') }
  }

  const methodOptions = [
    { value: 'payoneer_naira' as WithdrawalMethod, label: 'Payoneer → Naira', sub: '4.5% fee deducted automatically' },
    { value: 'raenest_usd' as WithdrawalMethod, label: 'Raenest USD', sub: 'Enter the rate you see in-app' },
  ]

  const categories = preview ? [
    { label: 'Essentials', pct: '50%', amount: preview.essentials_ngn, color: 'var(--teal)' },
    { label: 'Growth', pct: '25%', amount: preview.growth_ngn, color: 'var(--sage)' },
    { label: 'Stability', pct: '15%', amount: preview.stability_ngn, color: 'var(--amber)' },
    { label: 'Reward', pct: '10%', amount: preview.reward_ngn, color: 'var(--mauve)' },
  ] : []

  return (
    <div className="min-h-screen pb-28">
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(200,150,90,0.05) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="animate-fade-up flex items-center gap-4 mb-8">
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>←</Link>
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              New Budget
            </p>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 24, fontWeight: 400, color: 'var(--cream)' }}>
              {formatWeekLabel(weekStart)}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Income input */}
          <div className="animate-fade-up stagger-1 card" style={{ padding: '1.25rem' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
              Weekly income (USD)
            </label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, color: 'var(--muted)', fontWeight: 300 }}>$</span>
              <input
                type="number" min="0" step="0.01" required
                value={incomeUsd} onChange={e => setIncomeUsd(e.target.value)}
                placeholder="0.00"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-cormorant)',
                  fontSize: 42, fontWeight: 300, color: 'var(--cream)', width: '100%', letterSpacing: '-0.01em' }}
              />
            </div>
          </div>

          {/* Withdrawal method */}
          <div className="animate-fade-up stagger-2 card" style={{ padding: '1.25rem' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
              Withdrawal method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {methodOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setMethod(opt.value)}
                  className={`pill-option ${method === opt.value ? 'active' : ''}`}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                    color: method === opt.value ? 'var(--gold)' : 'var(--cream)', marginBottom: 2 }}>
                    {opt.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Exchange rate */}
          <div className="animate-fade-up stagger-3 card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {method === 'payoneer_naira' ? 'Payoneer rate' : 'Raenest rate'} (₦ per $1)
              </label>
              <button type="button" onClick={fetchMarketRate} disabled={rateLoading}
                style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', opacity: rateLoading ? 0.5 : 1 }}>
                {rateLoading ? '…' : '↻ Market rate'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, color: 'var(--muted)', fontWeight: 300 }}>₦</span>
              <input
                type="number" min="0" step="0.01" required
                value={rate} onChange={e => setRate(e.target.value)}
                placeholder="e.g. 1650"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-cormorant)',
                  fontSize: 42, fontWeight: 300, color: 'var(--cream)', width: '100%', letterSpacing: '-0.01em' }}
              />
            </div>
            {marketRate && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dimmed)', marginTop: 8 }}>
                Market ref: ₦{Math.round(marketRate).toLocaleString()} · Enter the rate shown in your app
              </p>
            )}
          </div>

          {/* Live preview */}
          {preview && (
            <div className="animate-slide-down card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                Budget preview
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--muted)' }}>Gross ({formatUsd(parsedIncome)} × ₦{parsedRate.toLocaleString()})</span>
                  <span style={{ color: 'var(--cream)', fontFamily: 'var(--font-mono)' }}>{formatNgn(preview.gross_ngn)}</span>
                </div>
                {preview.fee_amount_ngn > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: 'var(--muted)' }}>Payoneer fee (4.5%)</span>
                    <span style={{ color: 'var(--err)', fontFamily: 'var(--font-mono)' }}>− {formatNgn(preview.fee_amount_ngn)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gold-border)', paddingTop: 8, fontSize: 14, fontWeight: 500 }}>
                  <span style={{ color: 'var(--cream-dim)', fontFamily: 'var(--font-body)' }}>Net income</span>
                  <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{formatNgn(preview.net_ngn)}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {categories.map(c => (
                  <div key={c.label} style={{ background: 'var(--bg-elevated)', borderRadius: '0.75rem', padding: '0.75rem',
                    borderLeft: `3px solid ${c.color}` }}>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: 2 }}>{c.label} · {c.pct}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: c.color, fontWeight: 500 }}>{formatNgn(c.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="animate-fade-up stagger-4 card" style={{ padding: '1.25rem' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Weekly note <span style={{ color: 'var(--dimmed)' }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything unusual this week? Unexpected bills, couldn't hit savings goal, etc."
              rows={3}
              style={{
                width: '100%', background: 'var(--bg-input)', border: '1px solid var(--gold-border)',
                borderRadius: '0.875rem', padding: '0.75rem 1rem', color: 'var(--cream)',
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, resize: 'none',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--gold-border)')}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(176,80,80,0.1)', border: '1px solid rgba(176,80,80,0.3)',
              borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#D08080', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving || !parsedIncome || !parsedRate}
            className="btn-gold animate-fade-up stagger-5"
            style={{ padding: '1rem', fontSize: 16, width: '100%' }}>
            {saving ? 'Saving…' : 'Save this week\'s budget'}
          </button>
        </form>
      </div>
    </div>
  )
}
