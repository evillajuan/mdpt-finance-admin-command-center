import type {
  InvoiceRecord,
  AccountsPayableRecord,
  QuickBooksRecord,
  PayrollEntry,
  Exception,
} from './types'

export function detectExceptions(
  invoices: InvoiceRecord[],
  apRecords: AccountsPayableRecord[],
  qbRecords: QuickBooksRecord[],
  payrollEntries: PayrollEntry[]
): Exception[] {
  const exceptions: Exception[] = []
  const today = new Date()

  for (const inv of invoices) {
    if (
      inv.conversion_status !== 'Canceled' &&
      inv.conversion_status !== 'Converted' &&
      inv.conversion_status !== 'Approved' &&
      inv.conversion_status !== 'Sent' &&
      !inv.tessen_invoice_number
    ) {
      exceptions.push({
        type: 'missing_tessen_invoice',
        description: `Invoice ${inv.original_invoice_number ?? inv.id} has no Tessen invoice number`,
        severity: 'high',
        record_id: inv.id,
        record_type: 'invoice',
      })
    }

    if (
      (inv.conversion_status === 'Converted' ||
        inv.conversion_status === 'Approved') &&
      !apRecords.find((ap) => ap.invoice_record_id === inv.id)
    ) {
      exceptions.push({
        type: 'converted_not_in_asana',
        description: `Converted invoice ${inv.original_invoice_number ?? inv.id} not added to Asana AP`,
        severity: 'medium',
        record_id: inv.id,
        record_type: 'invoice',
      })
    }

    if (inv.due_date && inv.conversion_status !== 'Paid' && inv.conversion_status !== 'Canceled') {
      const due = new Date(inv.due_date)
      if (due < today) {
        exceptions.push({
          type: 'overdue',
          description: `Invoice ${inv.original_invoice_number ?? inv.id} is past due date`,
          severity: 'high',
          record_id: inv.id,
          record_type: 'invoice',
        })
      }
    }
  }

  for (const ap of apRecords) {
    if (
      ap.ap_status === 'Added to Asana' ||
      ap.ap_status === 'Pending Review' ||
      ap.ap_status === 'Approved'
    ) {
      if (!ap.asana_task_url) {
        exceptions.push({
          type: 'ap_missing_asana_url',
          description: `AP record for ${ap.invoice_number ?? ap.id} is missing Asana task URL`,
          severity: 'medium',
          record_id: ap.id,
          record_type: 'ap',
        })
      }
    }
  }

  for (const qb of qbRecords) {
    const relatedAp = apRecords.find((ap) => ap.id === qb.ap_record_id)
    if (
      relatedAp &&
      relatedAp.invoice_amount != null &&
      qb.qb_amount != null &&
      Math.abs(relatedAp.invoice_amount - qb.qb_amount) > 0.01
    ) {
      exceptions.push({
        type: 'qb_amount_mismatch',
        description: `QuickBooks amount mismatch for invoice ${qb.invoice_number ?? qb.id}`,
        severity: 'high',
        record_id: qb.id,
        record_type: 'quickbooks',
      })
    }

    if (
      qb.qb_status === 'Entered in QuickBooks' &&
      !qb.qb_bill_number &&
      !qb.qb_invoice_number
    ) {
      exceptions.push({
        type: 'qb_reference_missing',
        description: `QuickBooks entry for ${qb.invoice_number ?? qb.id} missing QB reference number`,
        severity: 'medium',
        record_id: qb.id,
        record_type: 'quickbooks',
      })
    }
  }

  for (const entry of payrollEntries) {
    if (!entry.invoice_number) {
      exceptions.push({
        type: 'payroll_missing_invoice',
        description: `Payroll row for ${entry.employee ?? entry.id} is missing invoice number`,
        severity: 'medium',
        record_id: entry.id,
        record_type: 'payroll',
      })
    }

    const gm = entry.gm_calc_gross_pay ?? 0
    if (gm < 0) {
      exceptions.push({
        type: 'negative_margin',
        description: `Payroll row for ${entry.employee ?? entry.id} has negative margin (${gm.toFixed(2)})`,
        severity: 'high',
        record_id: entry.id,
        record_type: 'payroll',
      })
    }

    if (entry.status === 'Processed' && !entry.processing_date) {
      exceptions.push({
        type: 'processed_missing_date',
        description: `Processed payroll row for ${entry.employee ?? entry.id} is missing processing date`,
        severity: 'medium',
        record_id: entry.id,
        record_type: 'payroll',
      })
    }

    if (
      entry.reimbursable_expenses != null &&
      entry.reimbursable_expenses > 0 &&
      (entry.total_expense_billing == null || entry.total_expense_billing === 0)
    ) {
      exceptions.push({
        type: 'reimbursement_not_billed',
        description: `Payroll row for ${entry.employee ?? entry.id} has reimbursable expenses not billed to client`,
        severity: 'medium',
        record_id: entry.id,
        record_type: 'payroll',
      })
    }
  }

  return exceptions
}
