import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
  className?: string
}

const colorMap = {
  default: { icon: 'text-slate-400', value: 'text-slate-900' },
  green: { icon: 'text-emerald-500', value: 'text-emerald-700' },
  red: { icon: 'text-red-500', value: 'text-red-700' },
  yellow: { icon: 'text-amber-500', value: 'text-amber-700' },
  blue: { icon: 'text-blue-500', value: 'text-blue-700' },
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'default', className }: Props) {
  const colors = colorMap[color]
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{title}</p>
        {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', colors.icon)} />}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', colors.value)}>{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}
