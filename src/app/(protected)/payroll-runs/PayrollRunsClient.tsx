'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DateCell } from '@/components/ui/DateCell'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PayrollRun } from '@/lib/types'

const STATUSES = ['Draft', 'Ready for Review', 'Approved', 'Processed', 'Needs Correction', 'Hold']

const emptyForm = { run_name: '', week_start_date: '', week_end_date: '', processing_date: '', status: 'Draft', notes: '' }

interface Props { initialRuns: PayrollRun[] }

export default function PayrollRunsClient({ initialRuns }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [runs, setRuns] = useState(initialRuns)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const { data, error } = await supabase.from('payroll_runs').insert({
        run_name: form.run_name || null, week_start_date: form.week_start_date || null,
        week_end_date: form.week_end_date || null, processing_date: form.processing_date || null,
        status: form.status, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      }).select().single()
      if (error) throw error
      setRuns((prev) => [data, ...prev])
      setShowModal(false)
      setForm({ ...emptyForm })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) })

  return (
    <>
      <div className="p-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => { setForm({ ...emptyForm }); setError(''); setShowModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> New Payroll Run
          </button>
        </div>
        {runs.length === 0 ? (
          <EmptyState title="No payroll runs yet" description="Create a payroll run to start entering payroll data." />
        ) : (
          <div className="divide-y divide-gray-100">
            {runs.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/payroll-runs/${run.id}`)}
                className="flex items-center justify-between px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{run.run_name ?? 'Unnamed Run'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <DateCell value={run.week_start_date} /> – <DateCell value={run.week_end_date} />
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={run.status} />
                  <span className="text-xs text-gray-400">Processing: <DateCell value={run.processing_date} /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">New Payroll Run</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Run Name</label>
                  <input type="text" {...f('run_name')} placeholder="e.g. Week of Jun 16, 2025" required className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Week Start', key: 'week_start_date' },
                    { label: 'Week End', key: 'week_end_date' },
                    { label: 'Processing Date', key: 'processing_date' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="date" {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select {...f('status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea {...f('notes')} rows={2} className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
              </div>
              {error && <p className="mx-5 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
