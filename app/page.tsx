import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WeeklyBudget, Transaction, Investment, BudgetCategory, formatNgn, formatUsd, formatWeekLabel, getWeekStart } from '@/lib/types'
import BudgetRing from '@/components/BudgetRing'
import WeeklyNotes from '@/components/WeeklyNotes'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStart().toISOString().split('T')[0]

  const [{ data: budgetData }, { data: txData }, { data: investData }] = await Promise.all([
    supabase.from('weekly_budgets').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', weekStart),
    supabase.from('investments').select('*').eq('user_id', user.id).gte('date', weekStart),
  ])

  const budget = budgetData as WeeklyBudget | null
  const transactions = (txData || []) as Transaction[]
  const investments = (investData || []) as Investment[]

  const spent: Record<BudgetCategory, number> = { essentials: 0, growth: 0, stability: 0, reward: 0 }
  transactions.forEach(tx => { spent[tx.category] += tx.amount_ngn })
  investments.forEach(inv => { spent.growth += inv.amount_ngn })

  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
  const totalInvested = investments.reduce((a, i) => a + i.amount_ngn, 0)
  const remaining = budget ? budget.net_ngn - totalSpent : 0

  return (
    <div className="min-h-screen pb-28">
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200,150,90,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="animate-fade-up flex justify-between items-start mb-8">
          <div>
            <p style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              This week
            </p>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, fontWeight: 400, color: 'var(--cream)', lineHeight: 1.1 }}>
              {formatWeekLabel(weekStart)}
            </h1>
          </div>
          <form action={signOut}>
            <button type="submit" style={{ color: 'var(--muted)', padding: '6px 12px', borderRadius: '0.625rem',
              fontSize: 11, fontFamily: 'var(--font-body)', border: '1px solid var(--gold-border)',
              background: 'transparent', cursor: 'pointer' }}>
              Sign out
            </button>
          </form>
        </div>

        {!budget ? (
          <div className="animate-fade-up stagger-1 flex flex-col items-center justify-center py-20 gap-6">
            <div style={{ width: 80, height: 80, borderRadius: '1.5rem', background: 'var(--bg-surface)',
              border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 40, color: 'var(--gold)', fontWeight: 300 }}>₦</span>
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: 'var(--cream)' }}>No budget this week</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, fontFamily: 'var(--font-body)' }}>Set your income to get started</p>
            </div>
            <Link href="/budget/new" className="btn-gold" style={{ padding: '0.75rem 2rem', fontSize: 15, display: 'inline-block', textDecoration: 'none' }}>
              Create Budget
            </Link>
          </div>
        ) : (
          <>
            {/* Hero card */}
            <div className="animate-fade-up stagger-1" style={{ background: 'linear-gradient(145deg, #1E1610 0%, #130E0A 100%)',
              border: '1px solid var(--gold-border)', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(200,150,90,0.4), transparent)' }} />

              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Net income</p>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 50, fontWeight: 300, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.01em' }}>
                {formatNgn(budget.net_ngn)}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {formatUsd(budget.income_usd)} @ ₦{budget.exchange_rate.toLocaleString()}
                </span>
                {budget.fee_amount_ngn > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--err)', background: 'rgba(176,80,80,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                    −{formatNgn(budget.fee_amount_ngn)} fee
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 18, borderTop: '1px solid var(--gold-border)', paddingTop: 14 }}>
                {[
                  { label: 'Spent', value: formatNgn(totalSpent), color: 'var(--cream)' },
                  { label: 'Invested', value: formatNgn(totalInvested), color: 'var(--sage)' },
                  { label: 'Remaining', value: formatNgn(remaining), color: remaining < 0 ? 'var(--err)' : 'var(--gold-light)' },
                ].map(s => (
                  <div key={s.label}>
                    <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{s.label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: s.color, fontWeight: 500 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="animate-fade-up stagger-2">
              <BudgetRing budget={budget} spent={spent} />
            </div>

            {/* Investments */}
            {investments.length > 0 && (
              <div className="animate-fade-up stagger-3 card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-body)' }}>
                  Investments this week
                </p>
                {investments.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBlock: 6 }}>
                    <div>
                      <span style={{ fontSize: 14, color: 'var(--cream)', fontFamily: 'var(--font-body)' }}>{inv.platform}</span>
                      {inv.notes && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>{inv.notes}</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--sage)' }}>{formatNgn(inv.amount_ngn)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weekly note */}
            <div className="animate-fade-up stagger-4">
              <WeeklyNotes budgetId={budget.id} initialNotes={budget.notes || ''} />
            </div>

            {/* Quick actions */}
            <div className="animate-fade-up stagger-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '1.25rem' }}>
              {[
                { href: '/transactions', icon: '+', label: 'Log expense', sub: 'Track spending', color: 'var(--teal)' },
                { href: '/investments', icon: '↑', label: 'Log investment', sub: 'Growth bucket', color: 'var(--sage)' },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: a.color, marginBottom: 4 }}>{a.icon}</p>
                    <p style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{a.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>

            <p className="animate-fade-up stagger-5" style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dimmed)', letterSpacing: '0.04em' }}>
              {budget.withdrawal_method === 'payoneer_naira' ? 'PAYONEER → NAIRA · 4.5% FEE DEDUCTED' : 'RAENEST USD ACCOUNT'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
