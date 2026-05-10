'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('weekly_budgets').delete().eq('id', budgetId)
    router.refresh()
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setConfirming(false)}
          style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', background: 'none', border: '1px solid var(--gold-border)', borderRadius: '0.5rem', padding: '4px 10px', cursor: 'pointer' }}>
          Keep
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ fontSize: 11, color: 'var(--err)', fontFamily: 'var(--font-body)', background: 'rgba(176,80,80,0.10)', border: '1px solid rgba(176,80,80,0.25)', borderRadius: '0.5rem', padding: '4px 10px', cursor: 'pointer' }}>
          {loading ? '…' : 'Delete'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ fontSize: 11, color: 'var(--dimmed)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--err)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--dimmed)')}>
      Delete
    </button>
  )
}
