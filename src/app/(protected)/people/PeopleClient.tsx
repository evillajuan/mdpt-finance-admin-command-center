'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CurrencyCell } from '@/components/ui/CurrencyCell'
import { DateCell } from '@/components/ui/DateCell'
import { FilterBar, type FilterConfig } from '@/components/ui/FilterBar'
import type { Employee } from '@/lib/types'

const FILTERS: FilterConfig[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'On Leave'] },
  { key: 'full_name', label: 'Name', type: 'text', placeholder: 'Search name' },
]

const emptyForm = {
  full_name: '', status: 'Active', company_name: '', classification: '', work_state: '',
  current_tax_state: '', role: '', pay_rate: '', overtime_rate: '',
  default_assignment: '', default_worker_type: '', default_lob: '', default_client: '',
  start_date: '', end_date: '', notes: '',
}

interface Props { initialEmployees: Employee[] }

export default function PeopleClient({ initialEmployees }: Props) {
  const supabase = createClient()
  const [employees, setEmployees] = useState(initialEmployees)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = employees.filter((e) => {
    if (filters.status && e.status !== filters.status) return false
    if (filters.full_name && !e.full_name?.toLowerCase().includes(filters.full_name.toLowerCase())) return false
    return true
  })

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowModal(true) }
  const openEdit = (e: Employee) => {
    setEditing(e)
    setForm({
      full_name: e.full_name ?? '', status: e.status ?? 'Active', company_name: e.company_name ?? '',
      classification: e.classification ?? '', work_state: e.work_state ?? '',
      current_tax_state: e.current_tax_state ?? '', role: e.role ?? '',
      pay_rate: String(e.pay_rate ?? ''), overtime_rate: String(e.overtime_rate ?? ''),
      default_assignment: e.default_assignment ?? '', default_worker_type: e.default_worker_type ?? '',
      default_lob: e.default_lob ?? '', default_client: e.default_client ?? '',
      start_date: e.start_date ?? '', end_date: e.end_date ?? '', notes: e.notes ?? '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        full_name: form.full_name || null, status: form.status,
        company_name: form.company_name || null, classification: form.classification || null,
        work_state: form.work_state || null, current_tax_state: form.current_tax_state || null,
        role: form.role || null, pay_rate: form.pay_rate ? parseFloat(form.pay_rate) : null,
        overtime_rate: form.overtime_rate ? parseFloat(form.overtime_rate) : null,
        default_assignment: form.default_assignment || null, default_worker_type: form.default_worker_type || null,
        default_lob: form.default_lob || null, default_client: form.default_client || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        notes: form.notes || null, updated_at: new Date().toISOString(),
      }
      if (editing) {
        const { data, error } = await supabase.from('employees').update(payload).eq('id', editing.id).select().single()
        if (error) throw error
        setEmployees((prev) => prev.map((e) => e.id === editing.id ? data : e))
      } else {
        const { data, error } = await supabase.from('employees').insert(payload).select().single()
        if (error) throw error
        setEmployees((prev) => [...prev, data])
      }
      setShowModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) })

  const columns: Column<Employee>[] = [
    { key: 'full_name', header: 'Name', sortable: true, render: (r) => <span className="font-medium text-slate-800">{r.full_name ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'company_name', header: 'Company' },
    { key: 'classification', header: 'Classification' },
    { key: 'role', header: 'Role' },
    { key: 'pay_rate', header: 'Pay Rate', render: (r) => <CurrencyCell value={r.pay_rate} /> },
    { key: 'work_state', header: 'Work State' },
    { key: 'default_client', header: 'Default Client' },
    { key: 'start_date', header: 'Start Date', render: (r) => <DateCell value={r.start_date} />, sortable: true },
  ]

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <FilterBar filters={FILTERS} values={filters} onChange={(k, v) => setFilters({ ...filters, [k]: v })} />
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New Employee
          </button>
        </div>
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} onRowClick={(r) => openEdit(r as unknown as Employee)} emptyTitle="No employees" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit Employee' : 'New Employee'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', key: 'full_name', type: 'text' },
                  { label: 'Company Name', key: 'company_name', type: 'text' },
                  { label: 'Classification', key: 'classification', type: 'text' },
                  { label: 'Work State', key: 'work_state', type: 'text' },
                  { label: 'Current Tax State', key: 'current_tax_state', type: 'text' },
                  { label: 'Role', key: 'role', type: 'text' },
                  { label: 'Pay Rate', key: 'pay_rate', type: 'number' },
                  { label: 'Overtime Rate', key: 'overtime_rate', type: 'number' },
                  { label: 'Default Assignment', key: 'default_assignment', type: 'text' },
                  { label: 'Default Worker Type', key: 'default_worker_type', type: 'text' },
                  { label: 'Default LOB', key: 'default_lob', type: 'text' },
                  { label: 'Default Client', key: 'default_client', type: 'text' },
                  { label: 'Start Date', key: 'start_date', type: 'date' },
                  { label: 'End Date', key: 'end_date', type: 'date' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} step={type === 'number' ? '0.01' : undefined} {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select {...f('status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {['Active', 'Inactive', 'On Leave'].map((s) => <option key={s} value={s}>{s}</option>)}
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
