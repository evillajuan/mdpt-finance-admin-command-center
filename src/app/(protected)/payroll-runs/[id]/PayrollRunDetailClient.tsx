'use client'

import { useState } from 'react'
import { Plus, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImportCsvModal } from '@/components/ui/ImportCsvModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { PayrollEntry } from '@/lib/types'

const STATUSES = ['Draft', 'Ready for Review', 'Approved', 'Processed', 'Needs Correction', 'Hold']

function calcEntry(e: Partial<PayrollEntry>): Partial<PayrollEntry> {
  const billedTotal = (e.billed_reg ?? 0) + (e.total_expense_billing ?? 0)
  const otPay = (e.pay_rate_ot ?? 0) * (e.ot_holiday_hours ?? 0)
  const grossPay = (e.pay_rate_reg ?? 0) * (e.reg_hours ?? 0) + otPay + (e.reimbursable_expenses ?? 0)
  const gmCalc = billedTotal - grossPay
  const netPay = grossPay - (e.employee_payroll_taxes ?? 0) - (e.other_deductions ?? 0)
  return { ...e, billed_total: billedTotal, ot_holiday_pay: otPay, gross_pay: grossPay, gm_calc_gross_pay: gmCalc, net_pay: netPay }
}

const emptyForm = {
  week: '', employee: '', assignment: '', worker_type: '', lob: '', client: '',
  invoice_number: '', billed_reg: '', total_expense_billing: '', pay_rate_reg: '',
  pay_rate_ot: '', reg_hours: '', ot_holiday_hours: '', reimbursable_expenses: '',
  employee_payroll_taxes: '', other_deductions: '', employer_payroll_taxes: '',
  workers_comp: '', status: 'Draft', processing_date: '',
}

interface Props { runId: string; initialEntries: PayrollEntry[] }

export default function PayrollRunDetailClient({ runId, initialEntries }: Props) {
  const supabase = createClient()
  const [entries, setEntries] = useState(initialEntries)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editing, setEditing] = useState<PayrollEntry | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowEntryModal(true) }
  const openEdit = (e: PayrollEntry) => {
    setEditing(e)
    setForm({
      week: e.week ?? '', employee: e.employee ?? '', assignment: e.assignment ?? '',
      worker_type: e.worker_type ?? '', lob: e.lob ?? '', client: e.client ?? '',
      invoice_number: e.invoice_number ?? '', billed_reg: String(e.billed_reg ?? ''),
      total_expense_billing: String(e.total_expense_billing ?? ''), pay_rate_reg: String(e.pay_rate_reg ?? ''),
      pay_rate_ot: String(e.pay_rate_ot ?? ''), reg_hours: String(e.reg_hours ?? ''),
      ot_holiday_hours: String(e.ot_holiday_hours ?? ''), reimbursable_expenses: String(e.reimbursable_expenses ?? ''),
      employee_payroll_taxes: String(e.employee_payroll_taxes ?? ''), other_deductions: String(e.other_deductions ?? ''),
      employer_payroll_taxes: String(e.employer_payroll_taxes ?? ''), workers_comp: String(e.workers_comp ?? ''),
      status: e.status ?? 'Draft', processing_date: e.processing_date ?? '',
    })
    setError('')
    setShowEntryModal(true)
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSaving(true); setError('')
    try {
      const base: Partial<PayrollEntry> = {
        payroll_run_id: runId,
        week: form.week || null, employee: form.employee || null, assignment: form.assignment || null,
        worker_type: form.worker_type || null, lob: form.lob || null, client: form.client || null,
        invoice_number: form.invoice_number || null,
        billed_reg: form.billed_reg ? parseFloat(form.billed_reg) : null,
        total_expense_billing: form.total_expense_billing ? parseFloat(form.total_expense_billing) : null,
        pay_rate_reg: form.pay_rate_reg ? parseFloat(form.pay_rate_reg) : null,
        pay_rate_ot: form.pay_rate_ot ? parseFloat(form.pay_rate_ot) : null,
        reg_hours: form.reg_hours ? parseFloat(form.reg_hours) : null,
        ot_holiday_hours: form.ot_holiday_hours ? parseFloat(form.ot_holiday_hours) : null,
        reimbursable_expenses: form.reimbursable_expenses ? parseFloat(form.reimbursable_expenses) : null,
        employee_payroll_taxes: form.employee_payroll_taxes ? parseFloat(form.employee_payroll_taxes) : null,
        other_deductions: form.other_deductions ? parseFloat(form.other_deductions) : null,
        employer_payroll_taxes: form.employer_payroll_taxes ? parseFloat(form.employer_payroll_taxes) : null,
        workers_comp: form.workers_comp ? parseFloat(form.workers_comp) : null,
        status: form.status, processing_date: form.processing_date || null,
      }
      const calced = calcEntry(base)
      const payload = { ...calced, updated_at: new Date().toISOString() }

      if (editing) {
        const { data, error: updateErr } = await supabase.from('payroll_entries').update(payload).eq('id', editing.id).select().single()
        if (updateErr) throw updateErr
        setEntries((prev) => prev.map((e) => e.id === editing.id ? (data as PayrollEntry) : e))
      } else {
        const { data, error: e } = await supabase.from('payroll_entries').insert(payload).select().single()
        if (e) throw e
        setEntries((prev) => [...prev, data])
      }
      setShowEntryModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async (rows: Record<string, string | number | null>[]): Promise<{ imported: number; failed: number }> => {
    let imported = 0; let failed = 0
    const fieldMap: Record<string, keyof PayrollEntry> = {
      'Week': 'week', 'Employee': 'employee', 'Assignment': 'assignment',
      'Worker Type': 'worker_type', 'LOB': 'lob', 'Client': 'client',
      'Invoice Number': 'invoice_number', 'Billed to Client (Reg)': 'billed_reg',
      'Total Expense Billing (Client Reimbursement)': 'total_expense_billing',
      'Pay Rate (Regular)': 'pay_rate_reg', 'Pay Rate (OT/Holiday)': 'pay_rate_ot',
      'Reg': 'reg_hours', 'OT / Holiday': 'ot_holiday_hours',
      'Reimbursable Expenses': 'reimbursable_expenses',
      'Employee Payroll Taxes': 'employee_payroll_taxes', 'Other Deductions': 'other_deductions',
      'Employer Payroll Taxes': 'employer_payroll_taxes', "Worker's Comp": 'workers_comp',
      'Status': 'status', 'Processing Date': 'processing_date',
    }
    for (const row of rows) {
      try {
        const base: Partial<PayrollEntry> = { payroll_run_id: runId }
        for (const [csvField, dbField] of Object.entries(fieldMap)) {
          const val = row[csvField]
          ;(base as Record<string, unknown>)[dbField] = val ?? null
        }
        const calced = calcEntry(base)
        const { data, error } = await supabase.from('payroll_entries').insert({ ...calced, updated_at: new Date().toISOString() }).select().single()
        if (error) throw error
        setEntries((prev) => [...prev, data])
        imported++
      } catch { failed++ }
    }
    await supabase.from('import_history').insert({
      payroll_run_id: runId, rows_imported: imported, rows_failed: failed,
      import_status: failed === 0 ? 'Success' : 'Partial', updated_at: new Date().toISOString(),
    })
    return { imported, failed }
  }

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value }),
  })

  const totals = {
    billed: entries.reduce((s, e) => s + (e.billed_total ?? 0), 0),
    gross: entries.reduce((s, e) => s + (e.gross_pay ?? 0), 0),
    gm: entries.reduce((s, e) => s + (e.gm_calc_gross_pay ?? 0), 0),
    net: entries.reduce((s, e) => s + (e.net_pay ?? 0), 0),
  }

  return (
    <>
      <div className="p-4">
        <div className="flex justify-end gap-2 mb-4">
          <button onClick={() => setShowCsvModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-medium rounded text-gray-700 hover:bg-gray-50">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>

        {entries.length === 0 ? (
          <EmptyState title="No payroll entries" description="Add rows manually or import from CSV." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Week','Employee','Assignment','Worker Type','LOB','Client','Invoice #','Billed (Reg)','Expense Bill','Billed Total','Pay Rate','OT Rate','Reg Hrs','OT Hrs','OT Pay','Reimb. Exp','Gross Pay','GM Calc','EE Taxes','Deductions','Net Pay','ER Taxes','W.Comp','Status','Proc. Date'].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-r border-gray-100 last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <tr key={e.id} onClick={() => openEdit(e)} className={`hover:bg-gray-50 cursor-pointer ${(e.gm_calc_gross_pay ?? 0) < 0 ? 'bg-red-50' : ''}`}>
                    <td className="px-2 py-1.5 text-gray-600 border-r border-gray-100">{e.week ?? '—'}</td>
                    <td className="px-2 py-1.5 font-medium text-slate-800 border-r border-gray-100 whitespace-nowrap">{e.employee ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600 border-r border-gray-100">{e.assignment ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600 border-r border-gray-100">{e.worker_type ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600 border-r border-gray-100">{e.lob ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-600 border-r border-gray-100 whitespace-nowrap">{e.client ?? '—'}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-600 border-r border-gray-100">{e.invoice_number ?? '—'}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.billed_reg)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.total_expense_billing)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right font-medium border-r border-gray-100">{formatCurrency(e.billed_total)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.pay_rate_reg)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.pay_rate_ot)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{e.reg_hours ?? '—'}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{e.ot_holiday_hours ?? '—'}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.ot_holiday_pay)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.reimbursable_expenses)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right font-medium border-r border-gray-100">{formatCurrency(e.gross_pay)}</td>
                    <td className={`px-2 py-1.5 tabular-nums text-right font-medium border-r border-gray-100 ${(e.gm_calc_gross_pay ?? 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{formatCurrency(e.gm_calc_gross_pay)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.employee_payroll_taxes)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.other_deductions)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right font-medium border-r border-gray-100">{formatCurrency(e.net_pay)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.employer_payroll_taxes)}</td>
                    <td className="px-2 py-1.5 tabular-nums text-right border-r border-gray-100">{formatCurrency(e.workers_comp)}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100"><StatusBadge status={e.status} /></td>
                    <td className="px-2 py-1.5 text-gray-500">{e.processing_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                  <td colSpan={7} className="px-2 py-1.5 text-gray-600">Totals</td>
                  <td colSpan={2} className="px-2 py-1.5" />
                  <td className="px-2 py-1.5 tabular-nums text-right">{formatCurrency(totals.billed)}</td>
                  <td colSpan={6} className="px-2 py-1.5" />
                  <td className="px-2 py-1.5 tabular-nums text-right">{formatCurrency(totals.gross)}</td>
                  <td className={`px-2 py-1.5 tabular-nums text-right ${totals.gm < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{formatCurrency(totals.gm)}</td>
                  <td colSpan={2} className="px-2 py-1.5" />
                  <td className="px-2 py-1.5 tabular-nums text-right">{formatCurrency(totals.net)}</td>
                  <td colSpan={4} className="px-2 py-1.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <ImportCsvModal open={showCsvModal} onClose={() => setShowCsvModal(false)} onImport={handleImport} />

      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit Entry' : 'New Payroll Entry'}</h2>
              <button onClick={() => setShowEntryModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Week', key: 'week', type: 'date' },
                  { label: 'Employee', key: 'employee', type: 'text' },
                  { label: 'Assignment', key: 'assignment', type: 'text' },
                  { label: 'Worker Type', key: 'worker_type', type: 'text' },
                  { label: 'LOB', key: 'lob', type: 'text' },
                  { label: 'Client', key: 'client', type: 'text' },
                  { label: 'Invoice Number', key: 'invoice_number', type: 'text' },
                  { label: 'Billed to Client (Reg)', key: 'billed_reg', type: 'number' },
                  { label: 'Expense Billing', key: 'total_expense_billing', type: 'number' },
                  { label: 'Pay Rate (Regular)', key: 'pay_rate_reg', type: 'number' },
                  { label: 'Pay Rate (OT/Holiday)', key: 'pay_rate_ot', type: 'number' },
                  { label: 'Reg Hours', key: 'reg_hours', type: 'number' },
                  { label: 'OT / Holiday Hours', key: 'ot_holiday_hours', type: 'number' },
                  { label: 'Reimbursable Expenses', key: 'reimbursable_expenses', type: 'number' },
                  { label: 'EE Payroll Taxes', key: 'employee_payroll_taxes', type: 'number' },
                  { label: 'Other Deductions', key: 'other_deductions', type: 'number' },
                  { label: 'ER Payroll Taxes', key: 'employer_payroll_taxes', type: 'number' },
                  { label: "Worker's Comp", key: 'workers_comp', type: 'number' },
                  { label: 'Processing Date', key: 'processing_date', type: 'date' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} step={type === 'number' ? '0.01' : undefined} {...f(key as keyof typeof form)} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select {...f('status')} className="w-full h-8 border border-gray-200 rounded px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="mx-5 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEntryModal(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
