'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BookOpen,
  Users,
  Building2,
  Settings,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoice Conversion', href: '/invoice-conversion', icon: FileText },
  { label: 'Accounts Receivable', href: '/accounts-payable', icon: CreditCard },
  { label: 'QuickBooks Tracker', href: '/quickbooks', icon: BookOpen },
  { label: 'Payroll Runs', href: '/payroll-runs', icon: Briefcase },
  { label: 'People', href: '/people', icon: Users },
  { label: 'Clients', href: '/clients', icon: Building2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-charcoal-900 flex flex-col h-full">
      <div className="px-5 py-6 border-b border-charcoal-800">
        <p className="text-[10px] font-medium text-gold-muted uppercase tracking-[0.2em]">Finance Admin</p>
        <p className="font-display text-lg font-medium text-white mt-1 leading-tight tracking-wide">Command Center</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-xs rounded transition-all duration-150',
                active
                  ? 'bg-charcoal-800 text-white font-medium border-l-2 border-gold pl-[10px]'
                  : 'text-charcoal-600 hover:text-white hover:bg-charcoal-800/60 border-l-2 border-transparent pl-[10px]'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-gold' : 'text-charcoal-600')} />
              <span className="tracking-wide">{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-charcoal-800">
        <div className="w-6 h-px bg-gold opacity-40" />
      </div>
    </aside>
  )
}
