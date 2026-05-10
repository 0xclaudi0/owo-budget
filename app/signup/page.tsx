'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(200,150,90,0.07) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="animate-fade-up mb-8 flex flex-col items-center gap-4">
        <div style={{ width: 68, height: 68, borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, #C8965A 0%, #7A5530 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 48px rgba(200,150,90,0.30)' }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 34, color: '#0C0805', fontWeight: 600 }}>₦</span>
        </div>
        <div className="text-center">
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 40, fontWeight: 400, color: 'var(--cream)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Owo Budget
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, fontFamily: 'var(--font-body)' }}>
            Your money, your rules
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="animate-fade-up stagger-2 card w-full" style={{ maxWidth: 360, padding: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 500, color: 'var(--cream)', marginBottom: 20 }}>
          Create account
        </h2>

        {error && (
          <div style={{ background: 'rgba(176,80,80,0.12)', border: '1px solid rgba(176,80,80,0.3)',
            borderRadius: '0.75rem', padding: '0.7rem 1rem', color: '#D08080',
            fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-body)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gold"
            style={{ padding: '0.85rem', fontSize: 15, marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <div className="animate-fade-up stagger-4" style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--dimmed)', fontSize: 11 }}>
        <div style={{ height: 1, width: 40, background: 'var(--gold-border)' }} />
        <span>50 · 25 · 15 · 10</span>
        <div style={{ height: 1, width: 40, background: 'var(--gold-border)' }} />
      </div>
    </div>
  )
}
