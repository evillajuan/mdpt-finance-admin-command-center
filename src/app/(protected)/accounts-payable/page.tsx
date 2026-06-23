import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import AccountsPayableClient from './AccountsPayableClient'

export default async function AccountsPayablePage() {
  const supabase = await createClient()
  const [apRes, invRes] = await Promise.all([
    supabase.from('accounts_payable_records').select('*').order('created_at', { ascending: false }),
    supabase.from('invoice_records').select('id, original_invoice_number, client').order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <PageHeader title="Accounts Receivable" subtitle="Track invoices added to Asana AP project" />
      <SectionCard>
        <AccountsPayableClient initialRecords={apRes.data ?? []} invoices={invRes.data ?? []} />
      </SectionCard>
    </div>
  )
}
