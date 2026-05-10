import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeeklyBudget, Transaction, Investment, BudgetCategory, CATEGORY_CONFIG, formatNgn, formatUsd, formatWeekLabel, getWeekStart } from '@/lib/types'
import DeleteBudgetButton from '@/components/DeleteBudgetButton'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentWeekStart = getWeekStart().toISOString().split('T')[0]

  const [{ data: budgetsData }, { data: txData }, { data: invData }] = await Promise.all([
    supabase.from('weekly_budgets').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(20),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('investments').select('*').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  const budgets = (budgetsData || []) as WeeklyBudget[]
  const transactions = (txData || []) as Transaction[]
  const investments = (invData || []) as Investment[]

  return (
    <div className="min-h-screen pb-28">
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(200,150,90,0.04) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="animate-fade-up mb-8">
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Past weeks
          </p>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, fontWeight: 400, color: 'var(--cream)' }}>History</h1>
        </div>

        {budgets.length === 0 && (
          <div className="animate-fade-up card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, color: 'var(--muted)', fontStyle: 'italic' }}>No budgets yet</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {budgets.map((budget, idx) => {
            const isCurrentWeek = budget.week_start === currentWeekStart
            const weekTx = transactions.filter(tx => tx.budget_id === budget.id)
            const weekInv = investments.filter(inv => inv.budget_id === budget.id)

            const spent: Record<BudgetCategory, number> = { essentials: 0, growth: 0, stability: 0, reward: 0 }
            weekTx.forEach(tx => { spent[tx.category] += tx.amount_ngn })
            weekInv.forEach(inv => { spent.growth += inv.amount_ngn })

            const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
            const totalInvested = weekInv.reduce((a, i) => a + i.amount_ngn, 0)
            const saved = budget.net_ngn - totalSpent
            const platforms = [...new Set(weekInv.map(i => i.platform))]

            return (
              <div
                key={budget.id}
                className={`animate-fade-up card stagger-${Math.min(idx + 1, 5)}`}
                style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
              >
                {/* Top shine on current week */}
                {isCurrentWeek && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(200,150,90,0.5), transparent)' }} />
                )}

                {/* Week header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, fontWeight: 400, color: 'var(--cream)' }}>
                        {formatWeekLabel(budget.week_start)}
                      </h2>
                      {isCurrentWeek && (
                        <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-mono)',
                          background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                          padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em' }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {formatUsd(budget.income_usd)} · ₦{budget.exchange_rate.toLocaleString()} · {budget.withdrawal_method === 'payoneer_naira' ? 'Payoneer' : 'Raenest'}
                    </p>
                  </div>
                  <DeleteBudgetButton budgetId={budget.id} />
                </div>

                {/* Net income */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '0.875rem', padding: '0.75rem 1rem', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Net income</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>{formatNgn(budget.net_ngn)}</span>
                  </div>
                  {budget.fee_amount_ngn > 0 && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dimmed)', marginTop: 4 }}>
                      Fee: {formatNgn(budget.fee_amount_ngn)}
                    </p>
                  )}
                </div>

                {/* Category mini bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {(['essentials', 'growth', 'stability', 'reward'] as BudgetCategory[]).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat]
                    const allocated = budget[`${cat}_ngn` as keyof WeeklyBudget] as number
                    const spentAmt = spent[cat]
                    const pct = allocated > 0 ? Math.min((spentAmt / allocated) * 100, 100) : 0
                    const over = spentAmt > allocated
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', width: 72, flexShrink: 0 }}>{cfg.label}</span>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99,
                            background: over ? 'var(--err)' : cfg.hex,
                            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: over ? 'var(--err)' : 'var(--muted)', width: 80, textAlign: 'right', flexShrink: 0 }}>
                          {formatNgn(spentAmt)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Summary footer */}
                <div style={{ display: 'flex', gap: 20, borderTop: '1px solid var(--gold-border)', paddingTop: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Spent', value: formatNgn(totalSpent), color: 'var(--cream)' },
                    { label: 'Invested', value: formatNgn(totalInvested), color: 'var(--sage)' },
                    { label: 'Saved', value: formatNgn(saved), color: saved >= 0 ? 'var(--teal)' : 'var(--err)' },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: s.color, fontWeight: 500 }}>{s.value}</p>
                    </div>
                  ))}
                  {platforms.length > 0 && (
                    <div style={{ marginLeft: 'auto' }}>
                      <p style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Platforms</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--cream-dim)' }}>{platforms.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
