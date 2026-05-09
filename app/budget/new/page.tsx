'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WithdrawalMethod, calcBudget, formatNgn, formatUsd, getWeekStart, formatWeekLabel } from '@/lib/types'
import { RefreshCw, ArrowLeft } from 'lucide-react'
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
      if (data.rate) {
        setMarketRate(data.rate)
        if (!rate) setRate(Math.round(data.rate).toString())
      }
    } catch {}
    setRateLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsedIncome || !parsedRate) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const calc = calcBudget(parsedIncome, method, parsedRate)

    const { error: err } = await supabase.from('weekly_budgets').upsert({
      user_id: user.id,
      week_start: weekStart,
      income_usd: parsedIncome,
      withdrawal_method: method,
      exchange_rate: parsedRate,
      ...calc,
    }, { onConflict: 'user_id,week_start' })

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">New Budget</h1>
            <p className="text-gray-400 text-sm">{formatWeekLabel(weekStart)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Income */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Weekly income (USD)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-lg">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={incomeUsd}
                onChange={e => setIncomeUsd(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-white text-2xl font-bold focus:outline-none placeholder-gray-600"
              />
            </div>
          </div>

          {/* Withdrawal method */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">How are you withdrawing?</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'payoneer_naira', label: 'Payoneer → Naira', sub: '4.5% fee deducted' },
                { value: 'raenest_usd', label: 'Raenest USD', sub: 'Enter your rate below' },
              ] as { value: WithdrawalMethod; label: string; sub: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMethod(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${
                    method === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <p className={`font-semibold text-sm ${method === opt.value ? 'text-emerald-400' : 'text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Exchange rate */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">
                {method === 'payoneer_naira' ? 'Payoneer rate (₦ per $1)' : 'Raenest rate (₦ per $1)'}
              </label>
              <button
                type="button"
                onClick={fetchMarketRate}
                disabled={rateLoading}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
              >
                <RefreshCw size={12} className={rateLoading ? 'animate-spin' : ''} />
                Market rate
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">₦</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="e.g. 1650"
                className="flex-1 bg-transparent text-white text-2xl font-bold focus:outline-none placeholder-gray-600"
              />
            </div>
            {marketRate && (
              <p className="text-xs text-gray-500 mt-1">
                Market rate: ₦{Math.round(marketRate).toLocaleString()} · Enter the rate you see in the app
              </p>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-white font-semibold">Budget preview</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gross ({formatUsd(parsedIncome)} × ₦{parsedRate.toLocaleString()})</span>
                <span className="text-white">{formatNgn(preview.gross_ngn)}</span>
              </div>
              {preview.fee_amount_ngn > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Payoneer fee (4.5%)</span>
                  <span className="text-red-400">− {formatNgn(preview.fee_amount_ngn)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-gray-700 pt-2">
                <span className="text-gray-300">Net income</span>
                <span className="text-emerald-400">{formatNgn(preview.net_ngn)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {([
                  { label: 'Essentials 50%', amount: preview.essentials_ngn, color: 'text-blue-400' },
                  { label: 'Growth 25%', amount: preview.growth_ngn, color: 'text-emerald-400' },
                  { label: 'Stability 15%', amount: preview.stability_ngn, color: 'text-amber-400' },
                  { label: 'Reward 10%', amount: preview.reward_ngn, color: 'text-purple-400' },
                ] as { label: string; amount: number; color: string }[]).map(c => (
                  <div key={c.label} className="bg-gray-700/50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">{c.label}</p>
                    <p className={`font-semibold text-sm mt-0.5 ${c.color}`}>{formatNgn(c.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !parsedIncome || !parsedRate}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
          >
            {saving ? 'Saving…' : 'Save Budget'}
          </button>
        </form>
      </div>
    </div>
  )
}
