'use client'

import { CATEGORY_CONFIG, BudgetCategory, formatNgn, WeeklyBudget } from '@/lib/types'

interface Props {
  budget: WeeklyBudget
  spent: Record<BudgetCategory, number>
}

export default function BudgetRing({ budget, spent }: Props) {
  const categories: BudgetCategory[] = ['essentials', 'growth', 'stability', 'reward']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {categories.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat]
        const allocated = budget[`${cat}_ngn` as keyof WeeklyBudget] as number
        const spentAmt = spent[cat] || 0
        const pct = allocated > 0 ? Math.min((spentAmt / allocated) * 100, 100) : 0
        const remaining = Math.max(allocated - spentAmt, 0)
        const over = spentAmt > allocated

        return (
          <div
            key={cat}
            className="card"
            style={{ padding: '1rem 1.125rem', borderLeft: `3px solid ${cfg.hex}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--cream)' }}>
                  {cfg.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                  background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 99 }}>
                  {cfg.percent}%
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: over ? 'var(--err)' : 'var(--cream-dim)', fontWeight: 500 }}>
                {over ? `over ${formatNgn(spentAmt - allocated)}` : `${formatNgn(remaining)} left`}
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-bar"
                style={{ width: `${pct}%`, background: over ? 'var(--err)' : cfg.hex }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                {formatNgn(spentAmt)} spent
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dimmed)' }}>
                of {formatNgn(allocated)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
