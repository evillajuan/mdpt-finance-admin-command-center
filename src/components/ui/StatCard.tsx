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
  default: { icon: 'text-stone-warm', value: 'text-charcoal-900' },
  green: { icon: 'text-emerald-600', value: 'text-emerald-800' },
  red: { icon: 'text-rose-500', value: 'text-rose-800' },
  yellow: { icon: 'text-amber-500', value: 'text-amber-800' },
  blue: { icon: 'text-sky-500', value: 'text-sky-800' },
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'default', className }: Props) {
  const colors = colorMap[color]
  return (
    <div className={cn('bg-white border border-cream-border rounded-lg p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium text-stone-warm uppercase tracking-[0.15em] leading-tight">{title}</p>
        {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0 opacity-70', colors.icon)} />}
      </div>
      <p className={cn('mt-3 text-2xl font-semibold tabular-nums tracking-tight', colors.value)}>{value}</p>
      {subtitle && <p className="mt-1 text-[11px] text-stone-warm">{subtitle}</p>}
    </div>
  )
}
