import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeeklyBudget, Transaction, Investment, BudgetCategory, CATEGORY_CONFIG, formatNgn, formatUsd, formatWeekLabel, getWeekStart } from '@/lib/types'
import { ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-white mb-6">History</h1>

        {budgets.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>No past budgets yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {budgets.map(budget => {
            const isCurrentWeek = budget.week_start === currentWeekStart
            const weekTx = transactions.filter(tx => tx.budget_id === budget.id)
            const weekInv = investments.filter(inv => inv.budget_id === budget.id)

            const spent: Record<BudgetCategory, number> = { essentials: 0, growth: 0, stability: 0, reward: 0 }
            weekTx.forEach(tx => { spent[tx.category] += tx.amount_ngn })
            weekInv.forEach(inv => { spent.growth += inv.amount_ngn })

            const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
            const totalInvested = weekInv.reduce((a, i) => a + i.amount_ngn, 0)
            const savings = budget.net_ngn - totalSpent

            return (
              <div key={budget.id} className="bg-gray-800 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-semibold">{formatWeekLabel(budget.week_start)}</h2>
                      {isCurrentWeek && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {formatUsd(budget.income_usd)} · ₦{budget.exchange_rate.toLocaleString()} ·{' '}
                      {budget.withdrawal_method === 'payoneer_naira' ? 'Payoneer' : 'Raenest'}
                    </p>
                  </div>
                  <Link href={`/history/${budget.id}`} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <ChevronRight size={20} />
                  </Link>
                </div>

                {/* Income bar */}
                <div className="bg-gray-700 rounded-xl p-3 mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Net income</span>
                    <span className="text-white font-semibold">{formatNgn(budget.net_ngn)}</span>
                  </div>
                  {budget.fee_amount_ngn > 0 && (
                    <p className="text-xs text-gray-500">Fee deducted: {formatNgn(budget.fee_amount_ngn)}</p>
                  )}
                </div>

                {/* Category mini bars */}
                <div className="space-y-1.5 mb-3">
                  {(['essentials', 'growth', 'stability', 'reward'] as BudgetCategory[]).map((cat, i) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7']
                    const allocated = budget[`${cat}_ngn` as keyof WeeklyBudget] as number
                    const spentAmt = spent[cat]
                    const pct = allocated > 0 ? Math.min((spentAmt / allocated) * 100, 100) : 0
                    const over = spentAmt > allocated
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">{CATEGORY_CONFIG[cat].label}</span>
                        <div className="flex-1 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: over ? '#ef4444' : colors[i] }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs w-20 text-right">{formatNgn(spentAmt)}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Summary row */}
                <div className="flex gap-4 text-xs border-t border-gray-700 pt-3">
                  <div>
                    <p className="text-gray-500">Spent</p>
                    <p className="text-white font-medium">{formatNgn(totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Invested</p>
                    <p className="text-emerald-400 font-medium flex items-center gap-1">
                      <TrendingUp size={10} />{formatNgn(totalInvested)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Saved</p>
                    <p className={`font-medium ${savings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatNgn(savings)}</p>
                  </div>
                  {weekInv.length > 0 && (
                    <div className="ml-auto">
                      <p className="text-gray-500">Platforms</p>
                      <p className="text-gray-300">{[...new Set(weekInv.map(i => i.platform))].join(', ')}</p>
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
