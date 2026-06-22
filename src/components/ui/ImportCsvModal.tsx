'use client'

import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import { X, Upload, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'

const PAYROLL_FIELDS = [
  'Week',
  'Employee',
  'Assignment',
  'Worker Type',
  'LOB',
  'Client',
  'Invoice Number',
  'Billed to Client (Reg)',
  'Total Expense Billing (Client Reimbursement)',
  'Billed to Client Total',
  'Pay Rate (Regular)',
  'Pay Rate (OT/Holiday)',
  'Reg',
  'OT / Holiday',
  'OT / Holiday Pay',
  'Reimbursable Expenses',
  'Gross Pay',
  'GM Calc - Gross Pay',
  'Employee Payroll Taxes',
  'Other Deductions',
  'Net Pay',
  'Employer Payroll Taxes',
  "Worker's Comp",
  'Status',
  'Processing Date',
]

type Step = 'upload' | 'preview' | 'mapping' | 'validate' | 'confirm' | 'summary'

interface ParsedRow {
  [key: string]: string
}

interface MappedEntry {
  [field: string]: string | number | null
}

interface ValidationResult {
  row: number
  warnings: string[]
  errors: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  onImport: (entries: MappedEntry[]) => Promise<{ imported: number; failed: number }>
}

export function ImportCsvModal({ open, onClose, onImport }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setCsvHeaders([])
    setCsvRows([])
    setMapping({})
    setValidationResults([])
    setImportResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (file: File) => {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? []
        setCsvHeaders(headers)
        setCsvRows(results.data)
        const autoMap: Record<string, string> = {}
        for (const field of PAYROLL_FIELDS) {
          if (headers.includes(field)) autoMap[field] = field
        }
        setMapping(autoMap)
        setStep('preview')
      },
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }, [])

  const validate = () => {
    const results: ValidationResult[] = []
    csvRows.forEach((row, i) => {
      const warnings: string[] = []
      const errors: string[] = []
      const mappedInvoice = mapping['Invoice Number'] ? row[mapping['Invoice Number']] : ''
      const mappedEmployee = mapping['Employee'] ? row[mapping['Employee']] : ''
      if (!mappedEmployee) errors.push('Employee is required')
      if (!mappedInvoice) warnings.push('Invoice number is missing')
      if (errors.length || warnings.length) results.push({ row: i + 1, warnings, errors })
    })
    setValidationResults(results)
    setStep('validate')
  }

  const buildEntries = (): MappedEntry[] => {
    const numericFields = new Set([
      'Billed to Client (Reg)', 'Total Expense Billing (Client Reimbursement)',
      'Billed to Client Total', 'Pay Rate (Regular)', 'Pay Rate (OT/Holiday)',
      'Reg', 'OT / Holiday', 'OT / Holiday Pay', 'Reimbursable Expenses',
      'Gross Pay', 'GM Calc - Gross Pay', 'Employee Payroll Taxes',
      'Other Deductions', 'Net Pay', 'Employer Payroll Taxes', "Worker's Comp",
    ])
    return csvRows.map((row) => {
      const entry: MappedEntry = {}
      for (const [field, csvCol] of Object.entries(mapping)) {
        if (!csvCol) { entry[field] = null; continue }
        const val = row[csvCol] ?? ''
        if (numericFields.has(field)) {
          const n = parseFloat(val.replace(/[$,]/g, ''))
          entry[field] = isNaN(n) ? null : n
        } else {
          entry[field] = val || null
        }
      }
      return entry
    })
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const entries = buildEntries()
      const result = await onImport(entries)
      setImportResult(result)
      setStep('summary')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-900">Import Payroll CSV</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center hover:border-slate-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">Drop a CSV file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Supports standard payroll CSV format</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {step === 'preview' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">{csvRows.length} rows detected. Showing first 10:</p>
              <div className="overflow-x-auto border border-gray-200 rounded text-xs">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.slice(0, 8).map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                      {csvHeaders.length > 8 && <th className="px-2 py-1.5 text-gray-400">+{csvHeaders.length - 8} more</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {csvRows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {csvHeaders.slice(0, 8).map((h) => (
                          <td key={h} className="px-2 py-1.5 text-gray-700 whitespace-nowrap max-w-[120px] truncate">{row[h]}</td>
                        ))}
                        {csvHeaders.length > 8 && <td className="px-2 py-1.5 text-gray-400">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">Map CSV columns to payroll fields. Auto-matched fields are pre-filled.</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYROLL_FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-44 flex-shrink-0 truncate" title={field}>{field}</label>
                    <select
                      value={mapping[field] ?? ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className="flex-1 h-7 text-xs border border-gray-200 rounded px-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value="">— skip —</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'validate' && (
            <div>
              {validationResults.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-gray-700">All {csvRows.length} rows look good</p>
                  <p className="text-xs text-gray-400 mt-1">No errors or warnings found</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">{validationResults.length} row(s) have issues:</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validationResults.map((r) => (
                      <div key={r.row} className="border border-gray-200 rounded p-2.5 text-xs">
                        <p className="font-medium text-slate-700 mb-1">Row {r.row}</p>
                        {r.errors.map((e, i) => (
                          <p key={i} className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {e}</p>
                        ))}
                        {r.warnings.map((w, i) => (
                          <p key={i} className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {w}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-700">Ready to import <strong>{csvRows.length}</strong> rows.</p>
              {validationResults.some((r) => r.errors.length > 0) && (
                <p className="text-xs text-amber-600 mt-2">
                  {validationResults.filter((r) => r.errors.length > 0).length} rows have errors and will be skipped.
                </p>
              )}
            </div>
          )}

          {step === 'summary' && importResult && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
              <p className="text-base font-semibold text-slate-900">Import Complete</p>
              <p className="text-sm text-gray-600 mt-1">{importResult.imported} rows imported successfully</p>
              {importResult.failed > 0 && (
                <p className="text-sm text-red-600 mt-0.5">{importResult.failed} rows failed</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="flex gap-1">
            {(['upload', 'preview', 'mapping', 'validate', 'confirm', 'summary'] as Step[]).map((s, i) => (
              <div key={s} className={`w-1.5 h-1.5 rounded-full ${step === s ? 'bg-slate-700' : 'bg-gray-300'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step !== 'upload' && step !== 'summary' && (
              <button
                onClick={() => {
                  const steps: Step[] = ['upload', 'preview', 'mapping', 'validate', 'confirm', 'summary']
                  const i = steps.indexOf(step)
                  if (i > 0) setStep(steps[i - 1])
                }}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded text-gray-600 hover:bg-white"
              >
                Back
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('mapping')}
                className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"
              >
                Map Columns <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {step === 'mapping' && (
              <button
                onClick={validate}
                className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"
              >
                Validate <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {step === 'validate' && (
              <button
                onClick={() => setStep('confirm')}
                className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"
              >
                Continue <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {step === 'confirm' && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            )}
            {step === 'summary' && (
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
