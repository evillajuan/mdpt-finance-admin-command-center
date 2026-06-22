import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import InvoiceConversionClient from './InvoiceConversionClient'

export default async function InvoiceConversionPage() {
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoice_records')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Invoice Conversion"
        subtitle="Track PAS to Tessen invoice conversion workflow"
      />
      <SectionCard>
        <InvoiceConversionClient initialInvoices={invoices ?? []} />
      </SectionCard>
    </div>
  )
}
