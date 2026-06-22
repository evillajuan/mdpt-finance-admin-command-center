import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import QuickBooksClient from './QuickBooksClient'

export default async function QuickBooksPage() {
  const supabase = await createClient()
  const [qbRes, invRes, apRes] = await Promise.all([
    supabase.from('quickbooks_records').select('*').order('created_at', { ascending: false }),
    supabase.from('invoice_records').select('id, original_invoice_number, client'),
    supabase.from('accounts_payable_records').select('id, invoice_number, client'),
  ])

  return (
    <div>
      <PageHeader title="QuickBooks Tracker" subtitle="Track invoice and AP entry into QuickBooks" />
      <SectionCard>
        <QuickBooksClient initialRecords={qbRes.data ?? []} invoices={invRes.data ?? []} apRecords={apRes.data ?? []} />
      </SectionCard>
    </div>
  )
}
