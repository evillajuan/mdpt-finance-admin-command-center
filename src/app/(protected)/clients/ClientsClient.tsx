'use client'

import { useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Client, ClientLocation } from '@/lib/types'

const emptyForm = {
  client_name: '', billing_entity: '', default_lob: '', default_payment_terms: '',
  default_invoice_recipient: '', default_work_state: '', status: 'Active', notes: '',
  primary_contact_name: '', primary_contact_title: '', primary_contact_email: '', primary_contact_phone: '',
  billing_contact_name: '', billing_contact_title: '', billing_contact_email: '', billing_contact_phone: '',
}

const emptyLocation = (): Omit<ClientLocation, 'id' | 'created_at' | 'client_id'> => ({
  location_type: 'Work', label: '', address_line1: '', address_line2: '',
  city: '', state: '', zip: '', country: 'US',
})

interface Props { initialClients: Client[] }

export default function ClientsClient({ initialClients }: Props) {
  const supabase = createClient()
  const [clients, setClients] = useState(initialClients)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [locations, setLocations] = useState<(Omit<ClientLocation, 'id' | 'created_at' | 'client_id'> & { id?: string })[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'info' | 'primary' | 'billing' | 'locations'>('info')

  const openNew = () => {
    setEditing(null); setForm({ ...emptyForm }); setLocations([]); setError('')
    setActiveSection('info'); setShowModal(true)
  }

  const openEdit = async (c: Client) => {
    setEditing(c)
    setForm({
      client_name: c.client_name ?? '', billing_entity: c.billing_entity ?? '',
      default_lob: c.default_lob ?? '', default_payment_terms: c.default_payment_terms ?? '',
      default_invoice_recipient: c.default_invoice_recipient ?? '', default_work_state: c.default_work_state ?? '',
      status: c.status ?? 'Active', notes: c.notes ?? '',
      primary_contact_name: c.primary_contact_name ?? '', primary_contact_title: c.primary_contact_title ?? '',
      primary_contact_email: c.primary_contact_email ?? '', primary_contact_phone: c.primary_contact_phone ?? '',
      billing_contact_name: c.billing_contact_name ?? '', billing_contact_title: c.billing_contact_title ?? '',
      billing_contact_email: c.billing_contact_email ?? '', billing_contact_phone: c.billing_contact_phone ?? '',
    })
    setError(''); setActiveSection('info'); setShowModal(true)
    const { data } = await supabase.from('client_locations').select('*').eq('client_id', c.id).order('created_at')
    setLocations((data ?? []).map((l) => ({
      id: l.id, location_type: l.location_type, label: l.label,
      address_line1: l.address_line1, address_line2: l.address_line2,
      city: l.city, state: l.state, zip: l.zip, country: l.country,
    })))
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
        primary_contact_name: form.primary_contact_name || null,
        primary_contact_title: form.primary_contact_title || null,
        primary_contact_email: form.primary_contact_email || null,
        primary_contact_phone: form.primary_contact_phone || null,
        billing_contact_name: form.billing_contact_name || null,
        billing_contact_title: form.billing_contact_title || null,
        billing_contact_email: form.billing_contact_email || null,
        billing_contact_phone: form.billing_contact_phone || null,
      }

      let clientId: string
      if (editing) {
        const { data, error } = await supabase.from('clients').update(payload).eq('id', editing.id).select().single()
        if (error) throw error
        setClients((prev) => prev.map((c) => c.id === editing.id ? data : c))
        clientId = editing.id
      } else {
        const { data, error } = await supabase.from('clients').insert(payload).select().single()
        if (error) throw error
        setClients((prev) => [...prev, data])
        clientId = data.id
      }

      // Sync locations: delete all and re-insert
      await supabase.from('client_locations').delete().eq('client_id', clientId)
      if (locations.length > 0) {
        const locPayload = locations.map((l) => ({
          client_id: clientId,
          location_type: l.location_type || null, label: l.label || null,
          address_line1: l.address_line1 || null, address_line2: l.address_line2 || null,
          city: l.city || null, state: l.state || null, zip: l.zip || null,
          country: l.country || null,
        }))
        const { error: locErr } = await supabase.from('client_locations').insert(locPayload)
        if (locErr) throw locErr
      }

      setShowModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  })

  const updateLocation = (i: number, k: string, v: string) =>
    setLocations((prev) => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))

  const columns: Column<Client>[] = [
    { key: 'client_name', header: 'Client Name', sortable: true, render: (r) => <span className="font-medium text-slate-800">{r.client_name ?? '—'}</span> },
    { key: 'billing_entity', header: 'Billing Entity' },
    { key: 'default_lob', header: 'LOB' },
    { key: 'default_payment_terms', header: 'Payment Terms' },
    { key: 'primary_contact_name', header: 'Primary Contact' },
    { key: 'default_work_state', header: 'Work State' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const inputCls = 'w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'
  const sections: { key: typeof activeSection; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'primary', label: 'Primary Contact' },
    { key: 'billing', label: 'Billing Contact' },
    { key: 'locations', label: 'Locations' },
  ]

  return (
    <>
      <div className="p-4">
        <div className="flex justify-end mb-4">
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New Client
          </button>
        </div>
        <DataTable columns={columns} data={clients} onRowClick={(r) => openEdit(r as unknown as Client)} emptyTitle="No clients" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-gray-100 px-5 gap-4">
              {sections.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveSection(s.key)}
                  className={`py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${activeSection === s.key ? 'border-slate-800 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5">

                {/* Info section */}
                {activeSection === 'info' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Client Name', key: 'client_name' },
                      { label: 'Billing Entity', key: 'billing_entity' },
                      { label: 'Default LOB', key: 'default_lob' },
                      { label: 'Default Payment Terms', key: 'default_payment_terms' },
                      { label: 'Default Invoice Recipient', key: 'default_invoice_recipient' },
                      { label: 'Default Work State', key: 'default_work_state' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <input type="text" {...f(key as keyof typeof form)} className={inputCls} />
                      </div>
                    ))}
                    <div>
                      <label className={labelCls}>Status</label>
                      <select {...f('status')} className={inputCls}>
                        {['Active', 'Inactive'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Notes</label>
                      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                    </div>
                  </div>
                )}

                {/* Primary Contact section */}
                {activeSection === 'primary' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Name', key: 'primary_contact_name' },
                      { label: 'Title', key: 'primary_contact_title' },
                      { label: 'Email', key: 'primary_contact_email' },
                      { label: 'Phone', key: 'primary_contact_phone' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <input type="text" {...f(key as keyof typeof form)} className={inputCls} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Billing Contact section */}
                {activeSection === 'billing' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Name', key: 'billing_contact_name' },
                      { label: 'Title', key: 'billing_contact_title' },
                      { label: 'Email', key: 'billing_contact_email' },
                      { label: 'Phone', key: 'billing_contact_phone' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <input type="text" {...f(key as keyof typeof form)} className={inputCls} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Locations section */}
                {activeSection === 'locations' && (
                  <div className="space-y-4">
                    {locations.map((loc, i) => (
                      <div key={i} className="border border-gray-200 rounded-md p-3 relative">
                        <button
                          type="button"
                          onClick={() => setLocations((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Type</label>
                            <select value={loc.location_type ?? 'Work'} onChange={(e) => updateLocation(i, 'location_type', e.target.value)} className={inputCls}>
                              {['Work', 'Billing', 'Work & Billing'].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Label</label>
                            <input type="text" placeholder="e.g. HQ, Remote Office" value={loc.label ?? ''} onChange={(e) => updateLocation(i, 'label', e.target.value)} className={inputCls} />
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Address Line 1</label>
                            <input type="text" value={loc.address_line1 ?? ''} onChange={(e) => updateLocation(i, 'address_line1', e.target.value)} className={inputCls} />
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Address Line 2</label>
                            <input type="text" value={loc.address_line2 ?? ''} onChange={(e) => updateLocation(i, 'address_line2', e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>City</label>
                            <input type="text" value={loc.city ?? ''} onChange={(e) => updateLocation(i, 'city', e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>State</label>
                            <input type="text" value={loc.state ?? ''} onChange={(e) => updateLocation(i, 'state', e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>ZIP</label>
                            <input type="text" value={loc.zip ?? ''} onChange={(e) => updateLocation(i, 'zip', e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Country</label>
                            <input type="text" value={loc.country ?? 'US'} onChange={(e) => updateLocation(i, 'country', e.target.value)} className={inputCls} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLocations((prev) => [...prev, emptyLocation()])}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dashed border-gray-300 rounded text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Location
                    </button>
                  </div>
                )}
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
