import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  // Invoice statuses
  uploaded: 'bg-sky-50 text-sky-800 ring-sky-200',
  'needs conversion': 'bg-amber-50 text-amber-800 ring-amber-200',
  converted: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  'needs review': 'bg-amber-50 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  sent: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  canceled: 'bg-cream text-stone-warm ring-cream-border',
  // AP statuses
  'not added to asana': 'bg-cream text-stone-warm ring-cream-border',
  'added to asana': 'bg-sky-50 text-sky-800 ring-sky-200',
  'pending review': 'bg-amber-50 text-amber-800 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  'on hold': 'bg-orange-50 text-orange-800 ring-orange-200',
  'needs correction': 'bg-rose-50 text-rose-800 ring-rose-200',
  // QB statuses
  'not started': 'bg-cream text-stone-warm ring-cream-border',
  'entered in quickbooks': 'bg-sky-50 text-sky-800 ring-sky-200',
  reconciled: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  'void / canceled': 'bg-cream text-stone-warm ring-cream-border',
  // Payroll statuses
  draft: 'bg-cream text-stone-warm ring-cream-border',
  'ready for review': 'bg-sky-50 text-sky-800 ring-sky-200',
  processed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  hold: 'bg-orange-50 text-orange-800 ring-orange-200',
  // Generic
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  inactive: 'bg-cream text-stone-warm ring-cream-border',
}

interface Props {
  status: string | null | undefined
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  if (!status) return <span className="text-stone-warm">—</span>

  const key = status.toLowerCase()
  const colorClass = statusColors[key] ?? 'bg-cream text-stone-warm ring-cream-border'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full ring-1 font-medium whitespace-nowrap tracking-wide',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        colorClass
      )}
    >
      {status}
    </span>
  )
}
