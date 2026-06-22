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
    <div className={cn('flex flex-wrap items-center gap-2 mb-4', className)}>
      {filters.map((f) => (
        <div key={f.key} className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
              className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          )}
        </div>
      ))}
      {Object.values(values).some(Boolean) && (
        <button
          onClick={() => filters.forEach((f) => onChange(f.key, ''))}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
