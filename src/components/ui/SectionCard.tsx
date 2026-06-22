import { cn } from '@/lib/utils'

interface Props {
  title?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function SectionCard({ title, children, className, actions }: Props) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
