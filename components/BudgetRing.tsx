'use client'

import { CATEGORY_CONFIG, BudgetCategory, formatNgn, WeeklyBudget } from '@/lib/types'

interface Props {
  budget: WeeklyBudget
  spent: Record<BudgetCategory, number>
}

export default function BudgetRing({ budget, spent }: Props) {
  const categories: BudgetCategory[] = ['essentials', 'growth', 'stability', 'reward']
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7']

  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const config = CATEGORY_CONFIG[cat]
        const allocated = budget[`${cat}_ngn` as keyof WeeklyBudget] as number
        const spentAmt = spent[cat] || 0
        const pct = allocated > 0 ? Math.min((spentAmt / allocated) * 100, 100) : 0
        const remaining = Math.max(allocated - spentAmt, 0)
        const over = spentAmt > allocated

        return (
          <div key={cat} className="bg-gray-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: colors[i] }} />
                <span className="font-semibold text-white">{config.label}</span>
                <span className="text-gray-400 text-xs">{config.percent}%</span>
              </div>
              <span className={`text-sm font-medium ${over ? 'text-red-400' : 'text-gray-300'}`}>
                {over ? `Over by ${formatNgn(spentAmt - allocated)}` : `${formatNgn(remaining)} left`}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: over ? '#ef4444' : colors[i] }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatNgn(spentAmt)} spent</span>
              <span>{formatNgn(allocated)} allocated</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
