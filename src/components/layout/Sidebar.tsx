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
  { label: 'Invoice Editor', href: '/invoice-editor', icon: FileText },
  { label: 'Accounts Payable', href: '/accounts-payable', icon: CreditCard },
  { label: 'QuickBooks Tracker', href: '/quickbooks', icon: BookOpen },
  { label: 'Payroll Runs', href: '/payroll-runs', icon: Briefcase },
  { label: 'People', href: '/people', icon: Users },
  { label: 'Clients', href: '/clients', icon: Building2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Finance Admin</p>
        <p className="text-sm font-bold text-white mt-0.5 leading-tight">Command Center</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                active
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
