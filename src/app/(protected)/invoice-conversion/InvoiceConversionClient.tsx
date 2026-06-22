'use client'

import { useState } from 'react'
import { Plus, X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CurrencyCell } from '@/components/ui/CurrencyCell'
import { DateCell } from '@/components/ui/DateCell'
import { FilterBar, type FilterConfig } from '@/components/ui/FilterBar'
import type { InvoiceRecord } from '@/lib/types'

const STATUSES = ['Uploaded', 'Needs Conversion', 'Converted', 'Needs Review', 'Approved', 'Sent', 'Canceled']

const FILTERS: FilterConfig[] = [
  { key: 'conversion_status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'client', label: 'Client', type: 'text', placeholder: 'Filter client' },
  { key: 'week', label: 'Week', type: 'date' },
]

const emptyForm = {
  week: '', client: '', original_entity: 'PAS', target_entity: 'Tessen',
  original_invoice_number: '', tessen_invoice_number: '',
  original_invoice_date: '', tessen_invoice_date: '', due_date: '',
  invoice_amount: '', currency: 'USD',
  conversion_status: 'Uploaded', conversion_owner: '', conversion_date: '', notes: '',
}

interface Props { initialInvoices: InvoiceRecord[] }

export default function InvoiceConversionClient({ initialInvoices }: Props) {
  const supabase = createClient()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<InvoiceRecord | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [origFile, setOrigFile] = useState<File | null>(null)
  const [convFile, setConvFile] = useState<File | null>(null)

  const filtered = invoices.filter((inv) => {
    if (filters.conversion_status && inv.conversion_status !== filters.conversion_status) return false
    if (filters.client && !inv.client?.toLowerCase().includes(filters.client.toLowerCase())) return false
    if (filters.week && inv.week !== filters.week) return false
    return true
  })

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setError('')
    setOrigFile(null)
    setConvFile(null)
    setShowModal(true)
  }

  const openEdit = (inv: InvoiceRecord) => {
    setEditing(inv)
    setForm({
      week: inv.week ?? '', client: inv.client ?? '',
      original_entity: inv.original_entity ?? 'PAS', target_entity: inv.target_entity ?? 'Tessen',
      original_invoice_number: inv.original_invoice_number ?? '',
      tessen_invoice_number: inv.tessen_invoice_number ?? '',
      original_invoice_date: inv.original_invoice_date ?? '',
      tessen_invoice_date: inv.tessen_invoice_date ?? '',
      due_date: inv.due_date ?? '',
      invoice_amount: String(inv.invoice_amount ?? ''),
      currency: inv.currency ?? 'USD',
      conversion_status: inv.conversion_status ?? 'Uploaded',
      conversion_owner: inv.conversion_owner ?? '',
      conversion_date: inv.conversion_date ?? '',
      notes: inv.notes ?? '',
    })
    setError('')
    setOrigFile(null)
    setConvFile(null)
    setShowModal(true)
  }

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage.from('invoice-files').upload(path, file, { upsert: true })
    if (error) throw error
    return path
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let orig_path = editing?.original_invoice_file_path ?? null
      let conv_path = editing?.converted_invoice_file_path ?? null

      if (origFile) orig_path = await uploadFile(origFile, `original/${Date.now()}-${origFile.name}`)
      if (convFile) conv_path = await uploadFile(convFile, `converted/${Date.now()}-${convFile.name}`)

      const payload = {
        week: form.week || null,
        client: form.client || null,
        original_entity: form.original_entity,
        target_entity: form.target_entity,
        original_invoice_number: form.original_invoice_number || null,
        tessen_invoice_number: form.tessen_invoice_number || null,
        original_invoice_date: form.original_invoice_date || null,
        tessen_invoice_date: form.tessen_invoice_date || null,
        due_date: form.due_date || null,
        invoice_amount: form.invoice_amount ? parseFloat(form.invoice_amount) : null,
        currency: form.currency,
        original_invoice_file_path: orig_path,
        converted_invoice_file_path: conv_path,
        conversion_status: form.conversion_status,
        conversion_owner: form.conversion_owner || null,
        conversion_date: form.conversion_date || null,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (editing) {
        const { data, error } = await supabase
          .from('invoice_records').update(payload).eq('id', editing.id).select().single()
        if (error) throw error
        setInvoices((prev) => prev.map((i) => i.id === editing.id ? data : i))
      } else {
        const { data, error } = await supabase
          .from('invoice_records').insert(payload).select().single()
        if (error) throw error
        setInvoices((prev) => [data, ...prev])
      }
      setShowModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<InvoiceRecord>[] = [
    { key: 'week', header: 'Week', render: (r) => <DateCell value={r.week} />, sortable: true },
    { key: 'client', header: 'Client', sortable: true },
    { key: 'original_invoice_number', header: 'PAS Invoice #', render: (r) => <span className="font-mono text-xs">{r.original_invoice_number ?? '—'}</span> },
    { key: 'tessen_invoice_number', header: 'Tessen Invoice #', render: (r) => <span className="font-mono text-xs">{r.tessen_invoice_number ?? '—'}</span> },
    { key: 'invoice_amount', header: 'Amount', render: (r) => <CurrencyCell value={r.invoice_amount} />, sortable: true },
    { key: 'conversion_status', header: 'Status', render: (r) => <StatusBadge status={r.conversion_status} /> },
    { key: 'due_date', header: 'Due Date', render: (r) => <DateCell value={r.due_date} />, sortable: true },
    { key: 'conversion_owner', header: 'Owner' },
  ]

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) })

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <FilterBar filters={FILTERS} values={filters} onChange={(k, v) => setFilters({ ...filters, [k]: v })} />
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New Invoice
          </button>
        </div>
        <DataTable columns={columns} data={filtered} onRowClick={(r) => openEdit(r as unknown as InvoiceRecord)} emptyTitle="No invoices yet" emptyDescription="Click 'New Invoice' to add your first record." />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit Invoice Record' : 'New Invoice Record'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Week', key: 'week', type: 'date' },
                  { label: 'Client', key: 'client', type: 'text' },
                  { label: 'Original Entity', key: 'original_entity', type: 'text' },
                  { label: 'Target Entity', key: 'target_entity', type: 'text' },
                  { label: 'PAS Invoice Number', key: 'original_invoice_number', type: 'text' },
                  { label: 'Tessen Invoice Number', key: 'tessen_invoice_number', type: 'text' },
                  { label: 'PAS Invoice Date', key: 'original_invoice_date', type: 'date' },
                  { label: 'Tessen Invoice Date', key: 'tessen_invoice_date', type: 'date' },
                  { label: 'Due Date', key: 'due_date', type: 'date' },
                  { label: 'Invoice Amount', key: 'invoice_amount', type: 'number' },
                  { label: 'Currency', key: 'currency', type: 'text' },
                  { label: 'Conversion Owner', key: 'conversion_owner', type: 'text' },
                  { label: 'Conversion Date', key: 'conversion_date', type: 'date' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Conversion Status</label>
                  <select {...f('conversion_status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PAS Invoice File</label>
                  <label className="flex items-center gap-2 cursor-pointer h-8 border border-dashed border-gray-200 rounded px-2.5 text-xs text-gray-500 hover:border-gray-400">
                    <Upload className="w-3 h-3" />
                    {origFile ? origFile.name : (editing?.original_invoice_file_path ? 'Replace file' : 'Upload file')}
                    <input type="file" className="hidden" onChange={(e) => setOrigFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tessen Invoice File</label>
                  <label className="flex items-center gap-2 cursor-pointer h-8 border border-dashed border-gray-200 rounded px-2.5 text-xs text-gray-500 hover:border-gray-400">
                    <Upload className="w-3 h-3" />
                    {convFile ? convFile.name : (editing?.converted_invoice_file_path ? 'Replace file' : 'Upload file')}
                    <input type="file" className="hidden" onChange={(e) => setConvFile(e.target.files?.[0] ?? null)} />
                  </label>
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
