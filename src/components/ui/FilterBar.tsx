'use client'

import { cn } from '@/lib/utils'

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'text' | 'date'
  options?: string[]
  placeholder?: string
}

interface Props {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  className?: string
}

export function FilterBar({ filters, values, onChange, className }: Props) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5 mb-4', className)}>
      {filters.map((f) => (
        <div key={f.key} className="flex items-center gap-1.5">
          <label className="text-[10px] font-medium text-stone-warm uppercase tracking-[0.12em] whitespace-nowrap">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="h-7 text-xs border border-cream-border rounded px-2 bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-colors"
            >
              <option value="">All</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type={f.type}
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder ?? `Filter ${f.label}`}
              className="h-7 text-xs border border-cream-border rounded px-2 bg-white text-charcoal-800 placeholder:text-stone-warm focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-colors"
            />
          )}
        </div>
      ))}
      {Object.values(values).some(Boolean) && (
        <button
          onClick={() => filters.forEach((f) => onChange(f.key, ''))}
          className="text-[10px] text-stone-warm hover:text-charcoal-900 uppercase tracking-[0.12em] transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
