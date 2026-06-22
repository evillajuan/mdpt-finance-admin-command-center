import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DateCell } from '@/components/ui/DateCell'
import { SectionCard } from '@/components/ui/SectionCard'
import PayrollRunDetailClient from './PayrollRunDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function PayrollRunDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [runRes, entriesRes] = await Promise.all([
    supabase.from('payroll_runs').select('*').eq('id', id).single(),
    supabase.from('payroll_entries').select('*').eq('payroll_run_id', id).order('created_at', { ascending: true }),
  ])

  if (runRes.error || !runRes.data) notFound()

  const run = runRes.data
  const entries = entriesRes.data ?? []

  return (
    <div>
      <PageHeader
        title={run.run_name ?? 'Payroll Run'}
        subtitle={`${run.week_start_date ?? ''} – ${run.week_end_date ?? ''}`}
        actions={<StatusBadge status={run.status} size="md" />}
      />
      <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
        <div className="bg-white border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-500">Week Start</p>
          <p className="font-medium text-slate-800 mt-0.5"><DateCell value={run.week_start_date} /></p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-500">Week End</p>
          <p className="font-medium text-slate-800 mt-0.5"><DateCell value={run.week_end_date} /></p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-500">Processing Date</p>
          <p className="font-medium text-slate-800 mt-0.5"><DateCell value={run.processing_date} /></p>
        </div>
      </div>
      <SectionCard title={`Payroll Entries (${entries.length})`}>
        <PayrollRunDetailClient runId={id} initialEntries={entries} />
      </SectionCard>
    </div>
  )
}
