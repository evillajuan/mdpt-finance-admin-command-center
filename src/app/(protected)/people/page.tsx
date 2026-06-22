import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import PeopleClient from './PeopleClient'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('full_name', { ascending: true })

  return (
    <div>
      <PageHeader title="People" subtitle="Manage employees and contractors" />
      <SectionCard>
        <PeopleClient initialEmployees={employees ?? []} />
      </SectionCard>
    </div>
  )
}
