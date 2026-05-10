export type WithdrawalMethod = 'payoneer_naira' | 'raenest_usd'

export type BudgetCategory = 'essentials' | 'growth' | 'stability' | 'reward'

export type Account = 'palmpay' | 'kuda' | 'polaris' | 'other'

export interface WeeklyBudget {
  id: string
  user_id: string
  week_start: string // ISO date string (always a Monday)
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

export const CATEGORY_CONFIG: Record<BudgetCategory, { label: string; percent: number; hex: string }> = {
  essentials: { label: 'Essentials', percent: 50, hex: '#4A8FA4' },
  growth:     { label: 'Growth',     percent: 25, hex: '#5A9B74' },
  stability:  { label: 'Stability',  percent: 15, hex: '#C8965A' },
  reward:     { label: 'Reward',     percent: 10, hex: '#8A6A9A' },
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
  // Week starts on Monday, ends on Sunday
  const d = new Date(date)
  const day = d.getDay() // 0=Sun,1=Mon,...,6=Sat
  const diff = day === 0 ? 6 : day - 1 // days since last Monday
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatWeekLabel(isoDate: string): string {
  const start = new Date(isoDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 6) // Mon + 6 = Sun
  const fmt = (d: Date) => d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}
