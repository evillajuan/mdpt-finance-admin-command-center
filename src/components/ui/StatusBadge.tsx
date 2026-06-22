import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  // Invoice statuses
  uploaded: 'bg-blue-50 text-blue-700 ring-blue-200',
  'needs conversion': 'bg-amber-50 text-amber-700 ring-amber-200',
  converted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'needs review': 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  approved: 'bg-green-50 text-green-700 ring-green-200',
  sent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  canceled: 'bg-gray-100 text-gray-500 ring-gray-200',
  // AP statuses
  'not added to asana': 'bg-slate-50 text-slate-600 ring-slate-200',
  'added to asana': 'bg-blue-50 text-blue-700 ring-blue-200',
  'pending review': 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'on hold': 'bg-orange-50 text-orange-700 ring-orange-200',
  'needs correction': 'bg-red-50 text-red-700 ring-red-200',
  // QB statuses
  'not started': 'bg-slate-50 text-slate-500 ring-slate-200',
  'entered in quickbooks': 'bg-blue-50 text-blue-700 ring-blue-200',
  reconciled: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'void / canceled': 'bg-gray-100 text-gray-500 ring-gray-200',
  // Payroll statuses
  draft: 'bg-slate-50 text-slate-600 ring-slate-200',
  'ready for review': 'bg-blue-50 text-blue-700 ring-blue-200',
  processed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  hold: 'bg-orange-50 text-orange-700 ring-orange-200',
  // Generic
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inactive: 'bg-gray-100 text-gray-500 ring-gray-200',
}

interface Props {
  status: string | null | undefined
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  if (!status) return <span className="text-gray-400">—</span>

  const key = status.toLowerCase()
  const colorClass = statusColors[key] ?? 'bg-gray-100 text-gray-600 ring-gray-200'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full ring-1 font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        colorClass
      )}
    >
      {status}
    </span>
  )
}
