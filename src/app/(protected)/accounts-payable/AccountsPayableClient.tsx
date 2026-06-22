'use client'

import { useState } from 'react'
import { Plus, X, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CurrencyCell } from '@/components/ui/CurrencyCell'
import { DateCell } from '@/components/ui/DateCell'
import { FilterBar, type FilterConfig } from '@/components/ui/FilterBar'
import type { AccountsPayableRecord } from '@/lib/types'

const AP_STATUSES = ['Not Added to Asana', 'Added to Asana', 'Pending Review', 'Approved', 'Paid', 'On Hold', 'Needs Correction']

const FILTERS: FilterConfig[] = [
  { key: 'ap_status', label: 'Status', type: 'select', options: AP_STATUSES },
  { key: 'client', label: 'Client', type: 'text' },
]

const emptyForm = {
  invoice_record_id: '', client: '', vendor_payee: '', invoice_number: '',
  invoice_amount: '', due_date: '', ap_status: 'Not Added to Asana',
  asana_task_name: '', asana_task_url: '', asana_project: '',
  owner: '', approval_status: '', payment_status: '', notes: '',
}

interface Invoice { id: string; original_invoice_number: string | null; client: string | null }
interface Props { initialRecords: AccountsPayableRecord[]; invoices: Invoice[] }

export default function AccountsPayableClient({ initialRecords, invoices }: Props) {
  const supabase = createClient()
  const [records, setRecords] = useState(initialRecords)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AccountsPayableRecord | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = records.filter((r) => {
    if (filters.ap_status && r.ap_status !== filters.ap_status) return false
    if (filters.client && !r.client?.toLowerCase().includes(filters.client.toLowerCase())) return false
    return true
  })

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowModal(true) }
  const openEdit = (r: AccountsPayableRecord) => {
    setEditing(r)
    setForm({
      invoice_record_id: r.invoice_record_id ?? '',
      client: r.client ?? '', vendor_payee: r.vendor_payee ?? '',
      invoice_number: r.invoice_number ?? '', invoice_amount: String(r.invoice_amount ?? ''),
      due_date: r.due_date ?? '', ap_status: r.ap_status ?? 'Not Added to Asana',
      asana_task_name: r.asana_task_name ?? '', asana_task_url: r.asana_task_url ?? '',
      asana_project: r.asana_project ?? '', owner: r.owner ?? '',
      approval_status: r.approval_status ?? '', payment_status: r.payment_status ?? '',
      notes: r.notes ?? '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        invoice_record_id: form.invoice_record_id || null,
        client: form.client || null, vendor_payee: form.vendor_payee || null,
        invoice_number: form.invoice_number || null,
        invoice_amount: form.invoice_amount ? parseFloat(form.invoice_amount) : null,
        due_date: form.due_date || null, ap_status: form.ap_status,
        asana_task_name: form.asana_task_name || null, asana_task_url: form.asana_task_url || null,
        asana_project: form.asana_project || null, owner: form.owner || null,
        approval_status: form.approval_status || null, payment_status: form.payment_status || null,
        notes: form.notes || null, updated_at: new Date().toISOString(),
      }
      if (editing) {
        const { data, error } = await supabase.from('accounts_payable_records').update(payload).eq('id', editing.id).select().single()
        if (error) throw error
        setRecords((prev) => prev.map((r) => r.id === editing.id ? data : r))
      } else {
        const { data, error } = await supabase.from('accounts_payable_records').insert(payload).select().single()
        if (error) throw error
        setRecords((prev) => [data, ...prev])
      }
      setShowModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) })

  const columns: Column<AccountsPayableRecord>[] = [
    { key: 'client', header: 'Client', sortable: true },
    { key: 'vendor_payee', header: 'Vendor / Payee' },
    { key: 'invoice_number', header: 'Invoice #', render: (r) => <span className="font-mono text-xs">{r.invoice_number ?? '—'}</span> },
    { key: 'invoice_amount', header: 'Amount', render: (r) => <CurrencyCell value={r.invoice_amount} />, sortable: true },
    { key: 'due_date', header: 'Due Date', render: (r) => <DateCell value={r.due_date} />, sortable: true },
    { key: 'ap_status', header: 'AP Status', render: (r) => <StatusBadge status={r.ap_status} /> },
    { key: 'asana_task_url', header: 'Asana Task', render: (r) => r.asana_task_url ? <a href={r.asana_task_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>{r.asana_task_name ?? 'Open'} <ExternalLink className="w-3 h-3" /></a> : <span className="text-gray-400">—</span> },
    { key: 'owner', header: 'Owner' },
    { key: 'payment_status', header: 'Payment', render: (r) => <StatusBadge status={r.payment_status} /> },
  ]

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <FilterBar filters={FILTERS} values={filters} onChange={(k, v) => setFilters({ ...filters, [k]: v })} />
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New AP Record
          </button>
        </div>
        <DataTable columns={columns} data={filtered} onRowClick={(r) => openEdit(r as unknown as AccountsPayableRecord)} emptyTitle="No AP records" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit AP Record' : 'New AP Record'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Related Invoice Record</label>
                  <select {...f('invoice_record_id')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    <option value="">— Select invoice —</option>
                    {invoices.map((i) => <option key={i.id} value={i.id}>{i.original_invoice_number ?? i.id} — {i.client}</option>)}
                  </select>
                </div>
                {[
                  { label: 'Client', key: 'client', type: 'text' },
                  { label: 'Vendor / Payee', key: 'vendor_payee', type: 'text' },
                  { label: 'Invoice Number', key: 'invoice_number', type: 'text' },
                  { label: 'Invoice Amount', key: 'invoice_amount', type: 'number' },
                  { label: 'Due Date', key: 'due_date', type: 'date' },
                  { label: 'Owner', key: 'owner', type: 'text' },
                  { label: 'Asana Project', key: 'asana_project', type: 'text' },
                  { label: 'Asana Task Name', key: 'asana_task_name', type: 'text' },
                  { label: 'Approval Status', key: 'approval_status', type: 'text' },
                  { label: 'Payment Status', key: 'payment_status', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">AP Status</label>
                  <select {...f('ap_status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {AP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Asana Task URL</label>
                  <input type="url" {...f('asana_task_url')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
              </div>
              {error && <p className="mx-5 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
