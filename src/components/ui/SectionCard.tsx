import { cn } from '@/lib/utils'

interface Props {
  title?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function SectionCard({ title, children, className, actions }: Props) {
  return (
    <div className={cn('bg-white border border-cream-border rounded-lg shadow-sm', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-border">
          {title && <h2 className="text-xs font-semibold text-charcoal-700 uppercase tracking-[0.12em]">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
