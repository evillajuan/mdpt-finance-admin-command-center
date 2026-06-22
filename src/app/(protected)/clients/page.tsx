import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import ClientsClient from './ClientsClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('client_name', { ascending: true })

  return (
    <div>
      <PageHeader title="Clients" subtitle="Manage client accounts and billing settings" />
      <SectionCard>
        <ClientsClient initialClients={clients ?? []} />
      </SectionCard>
    </div>
  )
}
