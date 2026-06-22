'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Client } from '@/lib/types'

const emptyForm = {
  client_name: '', billing_entity: '', default_lob: '', default_payment_terms: '',
  default_invoice_recipient: '', default_work_state: '', status: 'Active', notes: '',
}

interface Props { initialClients: Client[] }

export default function ClientsClient({ initialClients }: Props) {
  const supabase = createClient()
  const [clients, setClients] = useState(initialClients)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowModal(true) }
  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({
      client_name: c.client_name ?? '', billing_entity: c.billing_entity ?? '',
      default_lob: c.default_lob ?? '', default_payment_terms: c.default_payment_terms ?? '',
      default_invoice_recipient: c.default_invoice_recipient ?? '', default_work_state: c.default_work_state ?? '',
      status: c.status ?? 'Active', notes: c.notes ?? '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        client_name: form.client_name || null, billing_entity: form.billing_entity || null,
        default_lob: form.default_lob || null, default_payment_terms: form.default_payment_terms || null,
        default_invoice_recipient: form.default_invoice_recipient || null,
        default_work_state: form.default_work_state || null, status: form.status,
        notes: form.notes || null, updated_at: new Date().toISOString(),
      }
      if (editing) {
        const { data, error } = await supabase.from('clients').update(payload).eq('id', editing.id).select().single()
        if (error) throw error
        setClients((prev) => prev.map((c) => c.id === editing.id ? data : c))
      } else {
        const { data, error } = await supabase.from('clients').insert(payload).select().single()
        if (error) throw error
        setClients((prev) => [...prev, data])
      }
      setShowModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) })

  const columns: Column<Client>[] = [
    { key: 'client_name', header: 'Client Name', sortable: true, render: (r) => <span className="font-medium text-slate-800">{r.client_name ?? '—'}</span> },
    { key: 'billing_entity', header: 'Billing Entity' },
    { key: 'default_lob', header: 'LOB' },
    { key: 'default_payment_terms', header: 'Payment Terms' },
    { key: 'default_work_state', header: 'Work State' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <>
      <div className="p-4">
        <div className="flex justify-end mb-4">
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New Client
          </button>
        </div>
        <DataTable columns={columns} data={clients as unknown as Record<string, unknown>[]} onRowClick={(r) => openEdit(r as unknown as Client)} emptyTitle="No clients" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Client Name', key: 'client_name', type: 'text' },
                  { label: 'Billing Entity', key: 'billing_entity', type: 'text' },
                  { label: 'Default LOB', key: 'default_lob', type: 'text' },
                  { label: 'Default Payment Terms', key: 'default_payment_terms', type: 'text' },
                  { label: 'Default Invoice Recipient', key: 'default_invoice_recipient', type: 'text' },
                  { label: 'Default Work State', key: 'default_work_state', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select {...f('status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {['Active', 'Inactive'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
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
