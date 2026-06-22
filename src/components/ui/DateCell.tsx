import { formatDate } from '@/lib/utils'

interface Props {
  value: string | null | undefined
}

export function DateCell({ value }: Props) {
  return <span>{formatDate(value)}</span>
}
