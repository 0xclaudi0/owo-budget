'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
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
          Sign in
        </h2>

        {error && (
          <div style={{ background: 'rgba(176,80,80,0.12)', border: '1px solid rgba(176,80,80,0.3)',
            borderRadius: '0.75rem', padding: '0.7rem 1rem', color: '#D08080',
            fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-body)' }}>
            {error}
          </div>
        )}

        {/* Email/password form */}
        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
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
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gold"
            style={{ padding: '0.85rem', fontSize: 15, marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--gold-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--dimmed)', fontFamily: 'var(--font-body)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--gold-border)' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={googleLoading} className="btn-ghost"
          style={{ width: '100%', padding: '0.85rem', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {!googleLoading && (
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="var(--cream)" fillOpacity=".9"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="var(--cream)" fillOpacity=".7"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="var(--cream)" fillOpacity=".5"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="var(--cream)" fillOpacity=".8"/>
            </svg>
          )}
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create one</Link>
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
