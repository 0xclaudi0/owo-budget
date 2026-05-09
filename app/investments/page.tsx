'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Investment, WeeklyBudget, formatNgn, getWeekStart } from '@/lib/types'
import { Plus, Trash2, TrendingUp } from 'lucide-react'

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!budget || !effectivePlatform) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('investments').insert({
      user_id: user.id,
      budget_id: budget.id,
      platform: effectivePlatform,
      amount_ngn: parseFloat(amount),
      notes,
      date,
    })

    setAmount('')
    setNotes('')
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('investments').delete().eq('id', id)
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-400">Loading…</div></div>

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">Investments</h1>
          {budget && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {!budget && (
          <div className="text-center py-12 text-gray-400">
            <p>No budget for this week yet.</p>
            <a href="/budget/new" className="text-emerald-400 mt-2 inline-block">Create one →</a>
          </div>
        )}

        {budget && (
          <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-800 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-emerald-300 font-semibold text-sm">Growth bucket (25%)</span>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-gray-400 text-xs">Allocated</p>
                <p className="text-white font-bold">{formatNgn(growthAllocated)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Invested</p>
                <p className="text-emerald-400 font-bold">{formatNgn(totalInvested)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Remaining</p>
                <p className="text-white font-bold">{formatNgn(remaining)}</p>
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: growthAllocated > 0 ? `${Math.min((totalInvested / growthAllocated) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {budget && showForm && (
          <form onSubmit={handleAdd} className="bg-gray-800 rounded-2xl p-4 mb-5 space-y-4">
            <h3 className="text-white font-semibold">Log investment</h3>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Platform</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PLATFORM_SUGGESTIONS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      platform === p
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {platform === 'Other' && (
                <input
                  type="text"
                  required
                  value={customPlatform}
                  onChange={e => setCustomPlatform(e.target.value)}
                  placeholder="Platform name (e.g. Cardano, Gold)"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (₦)</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-lg font-bold"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. S&P 500 index fund"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-medium">
                Cancel
              </button>
              <button type="submit" disabled={saving || !effectivePlatform} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Log'}
              </button>
            </div>
          </form>
        )}

        {investments.length === 0 && budget ? (
          <p className="text-center text-gray-500 py-8">No investments logged this week.</p>
        ) : (
          <div className="space-y-2">
            {investments.map(inv => (
              <div key={inv.id} className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-xl flex-shrink-0">
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{inv.platform}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(inv.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {inv.notes ? ` · ${inv.notes}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">{formatNgn(inv.amount_ngn)}</p>
                </div>
                <button onClick={() => handleDelete(inv.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
