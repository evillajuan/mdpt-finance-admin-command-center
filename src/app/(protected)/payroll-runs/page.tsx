import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import PayrollRunsClient from './PayrollRunsClient'

export default async function PayrollRunsPage() {
  const supabase = await createClient()
  const { data: runs } = await supabase
    .from('payroll_runs')
    .select('*')
    .order('week_start_date', { ascending: false })

  return (
    <div>
      <PageHeader title="Payroll Runs" subtitle="Create and manage payroll run periods" />
      <SectionCard>
        <PayrollRunsClient initialRuns={runs ?? []} />
      </SectionCard>
    </div>
  )
}
