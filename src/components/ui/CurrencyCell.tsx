import { formatCurrency } from '@/lib/utils'

interface Props {
  value: number | null | undefined
  className?: string
}

export function CurrencyCell({ value, className }: Props) {
  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {formatCurrency(value)}
    </span>
  )
}
