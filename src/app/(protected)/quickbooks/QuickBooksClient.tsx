'use client'

import { useState } from 'react'
import { Plus, X, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CurrencyCell } from '@/components/ui/CurrencyCell'
import { DateCell } from '@/components/ui/DateCell'
import { FilterBar, type FilterConfig } from '@/components/ui/FilterBar'
import type { QuickBooksRecord } from '@/lib/types'

const QB_STATUSES = ['Not Started', 'Entered in QuickBooks', 'Needs Correction', 'Reconciled', 'Void / Canceled']

const FILTERS: FilterConfig[] = [
  { key: 'qb_status', label: 'Status', type: 'select', options: QB_STATUSES },
  { key: 'client', label: 'Client', type: 'text' },
]

const emptyForm = {
  invoice_record_id: '', ap_record_id: '', client: '', vendor_customer: '',
  invoice_number: '', qb_bill_number: '', qb_invoice_number: '', qb_entry_date: '',
  qb_amount: '', qb_status: 'Not Started', qb_url: '', entered_by: '',
  reviewed_by: '', review_date: '', notes: '',
}

interface InvRef { id: string; original_invoice_number: string | null; client: string | null }
interface ApRef { id: string; invoice_number: string | null; client: string | null }
interface Props { initialRecords: QuickBooksRecord[]; invoices: InvRef[]; apRecords: ApRef[] }

export default function QuickBooksClient({ initialRecords, invoices, apRecords }: Props) {
  const supabase = createClient()
  const [records, setRecords] = useState(initialRecords)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<QuickBooksRecord | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = records.filter((r) => {
    if (filters.qb_status && r.qb_status !== filters.qb_status) return false
    if (filters.client && !r.client?.toLowerCase().includes(filters.client.toLowerCase())) return false
    return true
  })

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowModal(true) }
  const openEdit = (r: QuickBooksRecord) => {
    setEditing(r)
    setForm({
      invoice_record_id: r.invoice_record_id ?? '', ap_record_id: r.ap_record_id ?? '',
      client: r.client ?? '', vendor_customer: r.vendor_customer ?? '',
      invoice_number: r.invoice_number ?? '', qb_bill_number: r.qb_bill_number ?? '',
      qb_invoice_number: r.qb_invoice_number ?? '', qb_entry_date: r.qb_entry_date ?? '',
      qb_amount: String(r.qb_amount ?? ''), qb_status: r.qb_status ?? 'Not Started',
      qb_url: r.qb_url ?? '', entered_by: r.entered_by ?? '',
      reviewed_by: r.reviewed_by ?? '', review_date: r.review_date ?? '', notes: r.notes ?? '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        invoice_record_id: form.invoice_record_id || null,
        ap_record_id: form.ap_record_id || null,
        client: form.client || null, vendor_customer: form.vendor_customer || null,
        invoice_number: form.invoice_number || null, qb_bill_number: form.qb_bill_number || null,
        qb_invoice_number: form.qb_invoice_number || null, qb_entry_date: form.qb_entry_date || null,
        qb_amount: form.qb_amount ? parseFloat(form.qb_amount) : null,
        qb_status: form.qb_status, qb_url: form.qb_url || null,
        entered_by: form.entered_by || null, reviewed_by: form.reviewed_by || null,
        review_date: form.review_date || null, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      }
      if (editing) {
        const { data, error } = await supabase.from('quickbooks_records').update(payload).eq('id', editing.id).select().single()
        if (error) throw error
        setRecords((prev) => prev.map((r) => r.id === editing.id ? data : r))
      } else {
        const { data, error } = await supabase.from('quickbooks_records').insert(payload).select().single()
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

  const columns: Column<QuickBooksRecord>[] = [
    { key: 'client', header: 'Client', sortable: true },
    { key: 'vendor_customer', header: 'Vendor / Customer' },
    { key: 'invoice_number', header: 'Invoice #', render: (r) => <span className="font-mono text-xs">{r.invoice_number ?? '—'}</span> },
    { key: 'qb_bill_number', header: 'QB Bill #', render: (r) => <span className="font-mono text-xs">{r.qb_bill_number ?? '—'}</span> },
    { key: 'qb_amount', header: 'QB Amount', render: (r) => <CurrencyCell value={r.qb_amount} />, sortable: true },
    { key: 'qb_entry_date', header: 'Entry Date', render: (r) => <DateCell value={r.qb_entry_date} />, sortable: true },
    { key: 'qb_status', header: 'Status', render: (r) => <StatusBadge status={r.qb_status} /> },
    { key: 'qb_url', header: 'QB Link', render: (r) => r.qb_url ? <a href={r.qb_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>Open <ExternalLink className="w-3 h-3" /></a> : <span className="text-gray-400">—</span> },
    { key: 'entered_by', header: 'Entered By' },
  ]

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <FilterBar filters={FILTERS} values={filters} onChange={(k, v) => setFilters({ ...filters, [k]: v })} />
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New QB Record
          </button>
        </div>
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} onRowClick={(r) => openEdit(r as unknown as QuickBooksRecord)} emptyTitle="No QuickBooks records" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit QB Record' : 'New QB Record'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Related Invoice</label>
                  <select {...f('invoice_record_id')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    <option value="">— Select —</option>
                    {invoices.map((i) => <option key={i.id} value={i.id}>{i.original_invoice_number ?? i.id} — {i.client}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Related AP Record</label>
                  <select {...f('ap_record_id')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    <option value="">— Select —</option>
                    {apRecords.map((a) => <option key={a.id} value={a.id}>{a.invoice_number ?? a.id} — {a.client}</option>)}
                  </select>
                </div>
                {[
                  { label: 'Client', key: 'client', type: 'text' },
                  { label: 'Vendor / Customer', key: 'vendor_customer', type: 'text' },
                  { label: 'Invoice Number', key: 'invoice_number', type: 'text' },
                  { label: 'QB Bill Number', key: 'qb_bill_number', type: 'text' },
                  { label: 'QB Invoice Number', key: 'qb_invoice_number', type: 'text' },
                  { label: 'QB Entry Date', key: 'qb_entry_date', type: 'date' },
                  { label: 'QB Amount', key: 'qb_amount', type: 'number' },
                  { label: 'Entered By', key: 'entered_by', type: 'text' },
                  { label: 'Reviewed By', key: 'reviewed_by', type: 'text' },
                  { label: 'Review Date', key: 'review_date', type: 'date' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">QB Status</label>
                  <select {...f('qb_status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {QB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">QuickBooks URL</label>
                  <input type="url" {...f('qb_url')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
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
