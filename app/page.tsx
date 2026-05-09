import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WeeklyBudget, Transaction, Investment, BudgetCategory, formatNgn, formatUsd, formatWeekLabel, getWeekStart } from '@/lib/types'
import BudgetRing from '@/components/BudgetRing'
import { PlusCircle, LogOut, TrendingUp } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-400 text-sm">This week</p>
            <h1 className="text-xl font-bold text-white">
              {budget ? formatWeekLabel(weekStart) : 'No budget yet'}
            </h1>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-gray-500 hover:text-gray-300 p-2 transition-colors">
              <LogOut size={20} />
            </button>
          </form>
        </div>

        {!budget ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="bg-gray-800 rounded-full p-6">
              <PlusCircle className="text-emerald-400" size={40} />
            </div>
            <div className="text-center">
              <h2 className="text-white font-semibold text-lg">Set up this week&apos;s budget</h2>
              <p className="text-gray-400 text-sm mt-1">Enter your income to get started</p>
            </div>
            <Link
              href="/budget/new"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Create Budget
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-5 mb-5">
              <p className="text-emerald-100 text-sm mb-1">Net income this week</p>
              <p className="text-white text-3xl font-bold">{formatNgn(budget.net_ngn)}</p>
              <div className="flex gap-4 mt-2 text-sm text-emerald-100 flex-wrap">
                <span>{formatUsd(budget.income_usd)} @ ₦{budget.exchange_rate.toLocaleString()}</span>
                {budget.fee_amount_ngn > 0 && (
                  <span>· {formatNgn(budget.fee_amount_ngn)} fee</span>
                )}
              </div>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-emerald-200 text-xs">Spent</p>
                  <p className="text-white font-semibold">{formatNgn(totalSpent)}</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">Invested</p>
                  <p className="text-white font-semibold">{formatNgn(totalInvested)}</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">Remaining</p>
                  <p className="text-white font-semibold">{formatNgn(budget.net_ngn - totalSpent)}</p>
                </div>
              </div>
            </div>

            <BudgetRing budget={budget} spent={spent} />

            {investments.length > 0 && (
              <div className="mt-5 bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">This week&apos;s investments</h3>
                </div>
                <div className="space-y-2">
                  {investments.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{inv.platform}</span>
                      <span className="text-emerald-400 font-medium text-sm">{formatNgn(inv.amount_ngn)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-5">
              <Link href="/transactions" className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 flex items-center gap-3 transition-colors">
                <div className="bg-blue-500/20 p-2 rounded-xl">
                  <PlusCircle size={18} className="text-blue-400" />
                </div>
                <span className="text-white font-medium text-sm">Log expense</span>
              </Link>
              <Link href="/investments" className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 flex items-center gap-3 transition-colors">
                <div className="bg-emerald-500/20 p-2 rounded-xl">
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>
                <span className="text-white font-medium text-sm">Log investment</span>
              </Link>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                {budget.withdrawal_method === 'payoneer_naira' ? 'Payoneer → Naira (4.5% fee deducted)' : 'Raenest USD account'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
