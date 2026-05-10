'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',             icon: '⌂', label: 'Home' },
  { href: '/budget/new',   icon: '＋', label: 'Budget' },
  { href: '/transactions', icon: '⇄', label: 'Spend' },
  { href: '/investments',  icon: '↑', label: 'Invest' },
  { href: '/history',      icon: '◷', label: 'History' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (isAuthPage) return null

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      paddingTop: 8,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(17, 13, 9, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(200,150,90,0.20)',
        borderRadius: '9999px',
        padding: '8px 8px',
        gap: 2,
        pointerEvents: 'all',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,150,90,0.08) inset',
      }}>
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 16px', borderRadius: '9999px',
                background: active ? 'rgba(200,150,90,0.14)' : 'transparent',
                transition: 'background 0.2s',
                minWidth: 56,
              }}>
                <span style={{
                  fontSize: 17,
                  color: active ? 'var(--gold)' : 'var(--muted)',
                  lineHeight: 1,
                  transition: 'color 0.2s',
                  fontFamily: 'system-ui',
                }}>
                  {icon}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500,
                  color: active ? 'var(--gold)' : 'var(--dimmed)',
                  letterSpacing: '0.03em', lineHeight: 1,
                  transition: 'color 0.2s',
                }}>
                  {label}
                </span>
                {active && (
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--gold)', marginTop: 1 }} />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
