export type WithdrawalMethod = 'payoneer_naira' | 'raenest_usd'

export type BudgetCategory = 'essentials' | 'growth' | 'stability' | 'reward'

export type Account = 'palmpay' | 'kuda' | 'polaris' | 'other'

export interface WeeklyBudget {
  id: string
  user_id: string
  week_start: string // ISO date string (always a Wednesday)
  income_usd: number
  withdrawal_method: WithdrawalMethod
  exchange_rate: number
  gross_ngn: number
  fee_amount_ngn: number
  net_ngn: number
  essentials_ngn: number
  growth_ngn: number
  stability_ngn: number
  reward_ngn: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  budget_id: string
  category: BudgetCategory
  amount_ngn: number
  account: Account
  description: string
  date: string
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  budget_id: string
  platform: string
  amount_ngn: number
  notes: string
  date: string
  created_at: string
}

export const CATEGORY_CONFIG: Record<BudgetCategory, { label: string; percent: number; color: string; bg: string }> = {
  essentials: { label: 'Essentials', percent: 50, color: 'text-blue-600', bg: 'bg-blue-500' },
  growth:     { label: 'Growth',     percent: 25, color: 'text-emerald-600', bg: 'bg-emerald-500' },
  stability:  { label: 'Stability',  percent: 15, color: 'text-amber-600', bg: 'bg-amber-500' },
  reward:     { label: 'Reward',     percent: 10, color: 'text-purple-600', bg: 'bg-purple-500' },
}

export const ACCOUNT_LABELS: Record<Account, string> = {
  palmpay: 'PalmPay',
  kuda: 'Kuda',
  polaris: 'Polaris Bank',
  other: 'Other',
}

export function calcBudget(incomeUsd: number, method: WithdrawalMethod, rate: number) {
  const grossNgn = incomeUsd * rate
  // Payoneer direct-to-naira: 4% withdrawal + 0.5% conversion = 4.5%
  const feeRate = method === 'payoneer_naira' ? 0.045 : 0
  const feeAmountNgn = grossNgn * feeRate
  const netNgn = grossNgn - feeAmountNgn

  return {
    gross_ngn: grossNgn,
    fee_amount_ngn: feeAmountNgn,
    net_ngn: netNgn,
    essentials_ngn: netNgn * 0.50,
    growth_ngn: netNgn * 0.25,
    stability_ngn: netNgn * 0.15,
    reward_ngn: netNgn * 0.10,
  }
}

export function formatNgn(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getWeekStart(date: Date = new Date()): Date {
  // Week starts on Wednesday
  const d = new Date(date)
  const day = d.getDay() // 0=Sun,1=Mon,...,3=Wed
  const diff = (day >= 3) ? day - 3 : day + 4
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatWeekLabel(isoDate: string): string {
  const start = new Date(isoDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}
