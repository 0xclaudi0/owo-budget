'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, ArrowLeftRight, TrendingUp, History } from 'lucide-react'

const navItems = [
  { href: '/',             icon: LayoutDashboard, label: 'Home' },
  { href: '/budget/new',   icon: PlusCircle,      label: 'Budget' },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Spend' },
  { href: '/investments',  icon: TrendingUp,      label: 'Invest' },
  { href: '/history',      icon: History,         label: 'History' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
