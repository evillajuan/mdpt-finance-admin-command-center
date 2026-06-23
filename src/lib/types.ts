export interface Employee {
  id: string
  created_at: string
  updated_at: string
  full_name: string | null
  status: string | null
  company_name: string | null
  classification: string | null
  work_state: string | null
  current_tax_state: string | null
  role: string | null
  pay_rate: number | null
  overtime_rate: number | null
  default_assignment: string | null
  default_worker_type: string | null
  default_lob: string | null
  default_client: string | null
  start_date: string | null
  end_date: string | null
  notes: string | null
}

export interface Client {
  id: string
  created_at: string
  updated_at: string
  client_name: string | null
  billing_entity: string | null
  default_lob: string | null
  default_payment_terms: string | null
  default_invoice_recipient: string | null
  default_work_state: string | null
  status: string | null
  notes: string | null
  // Primary contact
  primary_contact_name: string | null
  primary_contact_title: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  // Billing contact
  billing_contact_name: string | null
  billing_contact_title: string | null
  billing_contact_email: string | null
  billing_contact_phone: string | null
}

export interface ClientLocation {
  id: string
  created_at: string
  client_id: string
  location_type: string | null
  label: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

export interface InvoiceRecord {
  id: string
  created_at: string
  updated_at: string
  week: string | null
  client: string | null
  original_entity: string | null
  target_entity: string | null
  original_invoice_number: string | null
  tessen_invoice_number: string | null
  original_invoice_date: string | null
  tessen_invoice_date: string | null
  due_date: string | null
  invoice_amount: number | null
  currency: string | null
  original_invoice_file_path: string | null
  converted_invoice_file_path: string | null
  conversion_status: string | null
  conversion_owner: string | null
  conversion_date: string | null
  notes: string | null
}

export interface AccountsPayableRecord {
  id: string
  created_at: string
  updated_at: string
  invoice_record_id: string | null
  client: string | null
  vendor_payee: string | null
  invoice_number: string | null
  invoice_amount: number | null
  due_date: string | null
  ap_status: string | null
  asana_task_name: string | null
  asana_task_url: string | null
  asana_project: string | null
  owner: string | null
  approval_status: string | null
  payment_status: string | null
  notes: string | null
}

export interface QuickBooksRecord {
  id: string
  created_at: string
  updated_at: string
  invoice_record_id: string | null
  ap_record_id: string | null
  client: string | null
  vendor_customer: string | null
  invoice_number: string | null
  qb_bill_number: string | null
  qb_invoice_number: string | null
  qb_entry_date: string | null
  qb_amount: number | null
  qb_status: string | null
  qb_url: string | null
  entered_by: string | null
  reviewed_by: string | null
  review_date: string | null
  notes: string | null
}

export interface PayrollRun {
  id: string
  created_at: string
  updated_at: string
  run_name: string | null
  week_start_date: string | null
  week_end_date: string | null
  processing_date: string | null
  status: string | null
  notes: string | null
}

export interface PayrollEntry {
  id: string
  created_at: string
  updated_at: string
  payroll_run_id: string | null
  week: string | null
  employee: string | null
  assignment: string | null
  worker_type: string | null
  lob: string | null
  client: string | null
  invoice_number: string | null
  billed_reg: number | null
  total_expense_billing: number | null
  billed_total: number | null
  pay_rate_reg: number | null
  pay_rate_ot: number | null
  reg_hours: number | null
  ot_holiday_hours: number | null
  ot_holiday_pay: number | null
  reimbursable_expenses: number | null
  gross_pay: number | null
  gm_calc_gross_pay: number | null
  employee_payroll_taxes: number | null
  other_deductions: number | null
  net_pay: number | null
  employer_payroll_taxes: number | null
  workers_comp: number | null
  status: string | null
  processing_date: string | null
}

export interface SettingsReferenceValue {
  id: string
  created_at: string
  updated_at: string
  category: string
  value: string
  sort_order: number | null
  active: boolean
}

export interface ImportHistory {
  id: string
  created_at: string
  updated_at: string
  payroll_run_id: string | null
  filename: string | null
  rows_imported: number | null
  rows_failed: number | null
  import_status: string | null
  imported_by: string | null
  notes: string | null
}

export interface Exception {
  type: string
  description: string
  severity: 'high' | 'medium' | 'low'
  record_id: string
  record_type: string
}
