import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { SectionCard } from '@/components/ui/SectionCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CurrencyCell } from '@/components/ui/CurrencyCell'
import { DateCell } from '@/components/ui/DateCell'
import { EmptyState } from '@/components/ui/EmptyState'
import { detectExceptions } from '@/lib/exceptions'
import { formatCurrency } from '@/lib/utils'
import {
  FileText, CheckCircle, Clock, AlertTriangle,
  DollarSign, TrendingUp, TrendingDown, Users,
} from 'lucide-react'
import type { InvoiceRecord, AccountsPayableRecord, QuickBooksRecord, PayrollEntry } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [invoicesRes, apRes, qbRes, payrollRes] = await Promise.all([
    supabase.from('invoice_records').select('*').order('created_at', { ascending: false }),
    supabase.from('accounts_payable_records').select('*'),
    supabase.from('quickbooks_records').select('*'),
    supabase.from('payroll_entries').select('*'),
  ])

  const invoices: InvoiceRecord[] = invoicesRes.data ?? []
  const apRecords: AccountsPayableRecord[] = apRes.data ?? []
  const qbRecords: QuickBooksRecord[] = qbRes.data ?? []
  const payrollEntries: PayrollEntry[] = payrollRes.data ?? []

  const totalInvoices = invoices.length
  const converted = invoices.filter((i) => ['Converted', 'Approved', 'Sent'].includes(i.conversion_status ?? '')).length
  const pendingConversion = invoices.filter((i) => ['Uploaded', 'Needs Conversion'].includes(i.conversion_status ?? '')).length
  const addedToAsana = apRecords.filter((a) => a.ap_status !== 'Not Added to Asana').length
  const pendingAsana = invoices.length - addedToAsana
  const enteredQB = qbRecords.filter((q) => q.qb_status === 'Entered in QuickBooks' || q.qb_status === 'Reconciled').length
  const pendingQB = invoices.length - enteredQB
  const payrollRows = payrollEntries.length
  const readyForReview = payrollEntries.filter((p) => p.status === 'Ready for Review').length

  const exceptions = detectExceptions(invoices, apRecords, qbRecords, payrollEntries)
  const exceptionCount = exceptions.length

  const totalBilled = payrollEntries.reduce((s, e) => s + (e.billed_total ?? 0), 0)
  const totalGross = payrollEntries.reduce((s, e) => s + (e.gross_pay ?? 0), 0)
  const totalGM = payrollEntries.reduce((s, e) => s + (e.gm_calc_gross_pay ?? 0), 0)
  const negativeMarginRows = payrollEntries.filter((e) => (e.gm_calc_gross_pay ?? 0) < 0).length

  const stats = [
    { title: 'Total Invoices Uploaded', value: totalInvoices, icon: FileText },
    { title: 'Converted to Tessen', value: converted, icon: CheckCircle, color: 'green' as const },
    { title: 'Pending Conversion', value: pendingConversion, icon: Clock, color: pendingConversion > 0 ? 'yellow' as const : 'default' as const },
    { title: 'Added to Asana AP', value: addedToAsana, icon: CheckCircle, color: 'green' as const },
    { title: 'Pending Asana AP Entry', value: pendingAsana, icon: Clock },
    { title: 'Entered in QuickBooks', value: enteredQB, icon: CheckCircle, color: 'green' as const },
    { title: 'Pending QuickBooks Entry', value: pendingQB, icon: Clock },
    { title: 'Payroll Rows Entered', value: payrollRows, icon: Users },
    { title: 'Ready for Review', value: readyForReview, icon: Clock, color: 'blue' as const },
    { title: 'Exceptions / Needs Review', value: exceptionCount, icon: AlertTriangle, color: exceptionCount > 0 ? 'red' as const : 'default' as const },
    { title: 'Total Billed to Client', value: formatCurrency(totalBilled), icon: DollarSign },
    { title: 'Total Gross Pay', value: formatCurrency(totalGross), icon: DollarSign },
    { title: 'Est. Gross Margin', value: formatCurrency(totalGM), icon: TrendingUp, color: totalGM >= 0 ? 'green' as const : 'red' as const },
    { title: 'Negative Margin Rows', value: negativeMarginRows, icon: TrendingDown, color: negativeMarginRows > 0 ? 'red' as const : 'default' as const },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Finance operations overview" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {exceptions.length > 0 && (
        <SectionCard title={`Exceptions (${exceptions.length})`} className="mb-6">
          <div className="divide-y divide-gray-100">
            {exceptions.slice(0, 10).map((ex, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${ex.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-xs text-slate-700">{ex.description}</p>
                  <p className="text-xs text-gray-400 capitalize">{ex.record_type} · {ex.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Workflow Overview">
        {invoices.length === 0 ? (
          <EmptyState title="No invoice records yet" description="Start by uploading a PAS invoice in the Invoice Conversion module." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {['Week', 'Client', 'Invoice #', 'From', 'To', 'Amount', 'Conversion', 'Asana AP', 'QuickBooks', 'Overall', 'Due Date'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {invoices.slice(0, 50).map((inv) => {
                  const ap = apRecords.find((a) => a.invoice_record_id === inv.id)
                  const qb = qbRecords.find((q) => q.invoice_record_id === inv.id)
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700"><DateCell value={inv.week} /></td>
                      <td className="px-3 py-2 text-gray-700 font-medium">{inv.client ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600 font-mono">{inv.original_invoice_number ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.original_entity ?? 'PAS'}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.target_entity ?? 'Tessen'}</td>
                      <td className="px-3 py-2"><CurrencyCell value={inv.invoice_amount} /></td>
                      <td className="px-3 py-2"><StatusBadge status={inv.conversion_status} /></td>
                      <td className="px-3 py-2"><StatusBadge status={ap?.ap_status ?? 'Not Added to Asana'} /></td>
                      <td className="px-3 py-2"><StatusBadge status={qb?.qb_status ?? 'Not Started'} /></td>
                      <td className="px-3 py-2">
                        {inv.conversion_status === 'Sent' && ap?.ap_status === 'Paid' && qb?.qb_status === 'Reconciled'
                          ? <StatusBadge status="Approved" />
                          : <StatusBadge status="In Progress" />
                        }
                      </td>
                      <td className="px-3 py-2"><DateCell value={inv.due_date} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
