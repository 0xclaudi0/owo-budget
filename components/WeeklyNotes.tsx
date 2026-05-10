'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  budgetId: string
  initialNotes: string
}

export default function WeeklyNotes({ budgetId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('weekly_budgets').update({ notes: draft }).eq('id', budgetId)
    setNotes(draft)
    setEditing(false)
    setSaving(false)
  }

  function handleCancel() {
    setDraft(notes)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="animate-slide-down" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Weekly note
        </p>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="e.g. Had unexpected car repair this week, couldn't hit savings target…"
          rows={3}
          style={{
            width: '100%', background: 'var(--bg-input)', border: '1px solid var(--gold)',
            borderRadius: '0.875rem', padding: '0.75rem 1rem', color: 'var(--cream)',
            fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, resize: 'none',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleCancel} className="btn-ghost"
            style={{ padding: '0.5rem 1rem', fontSize: 13, flex: 1 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-gold"
            style={{ padding: '0.5rem 1rem', fontSize: 13, flex: 1 }}>
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      {notes ? (
        <div
          onClick={() => { setDraft(notes); setEditing(true) }}
          style={{
            background: 'rgba(200,150,90,0.06)', border: '1px solid var(--gold-border)',
            borderLeft: '3px solid var(--gold)', borderRadius: '0.875rem',
            padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,150,90,0.10)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,150,90,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Weekly note
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
                {notes}
              </p>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0, fontFamily: 'var(--font-body)' }}>Edit</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setDraft(''); setEditing(true) }}
          style={{
            width: '100%', background: 'transparent', border: '1px dashed var(--gold-border)',
            borderRadius: '0.875rem', padding: '0.75rem 1rem', cursor: 'pointer',
            textAlign: 'left', transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.background = 'transparent' }}
        >
          <p style={{ fontSize: 13, color: 'var(--dimmed)', fontFamily: 'var(--font-body)' }}>
            + Add a note for this week
          </p>
          <p style={{ fontSize: 11, color: 'var(--dimmed)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
            Couldn&apos;t save? Unexpected expenses? Write it down.
          </p>
        </button>
      )}
    </div>
  )
}
