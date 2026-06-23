-- Finance Admin Command Center — Supabase Schema
-- Run this in the Supabase SQL Editor for your project

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  status text,
  company_name text,
  classification text,
  work_state text,
  current_tax_state text,
  role text,
  pay_rate numeric,
  overtime_rate numeric,
  default_assignment text,
  default_worker_type text,
  default_lob text,
  default_client text,
  start_date date,
  end_date date,
  notes text
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_name text,
  billing_entity text,
  default_lob text,
  default_payment_terms text,
  default_invoice_recipient text,
  default_work_state text,
  status text,
  notes text,
  -- Primary contact
  primary_contact_name text,
  primary_contact_title text,
  primary_contact_email text,
  primary_contact_phone text,
  -- Billing contact
  billing_contact_name text,
  billing_contact_title text,
  billing_contact_email text,
  billing_contact_phone text
);

-- Migration: add contact columns if table already exists
alter table clients add column if not exists primary_contact_name text;
alter table clients add column if not exists primary_contact_title text;
alter table clients add column if not exists primary_contact_email text;
alter table clients add column if not exists primary_contact_phone text;
alter table clients add column if not exists billing_contact_name text;
alter table clients add column if not exists billing_contact_title text;
alter table clients add column if not exists billing_contact_email text;
alter table clients add column if not exists billing_contact_phone text;

create table if not exists client_locations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references clients(id) on delete cascade,
  location_type text,
  label text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  country text default 'US'
);

create table if not exists invoice_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  week date,
  client text,
  original_entity text default 'PAS',
  target_entity text default 'Tessen',
  original_invoice_number text,
  tessen_invoice_number text,
  original_invoice_date date,
  tessen_invoice_date date,
  due_date date,
  invoice_amount numeric,
  currency text default 'USD',
  original_invoice_file_path text,
  converted_invoice_file_path text,
  conversion_status text default 'Uploaded',
  conversion_owner text,
  conversion_date date,
  notes text
);

create table if not exists accounts_payable_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invoice_record_id uuid references invoice_records(id) on delete set null,
  client text,
  vendor_payee text,
  invoice_number text,
  invoice_amount numeric,
  due_date date,
  ap_status text default 'Not Added to Asana',
  asana_task_name text,
  asana_task_url text,
  asana_project text,
  owner text,
  approval_status text,
  payment_status text,
  notes text
);

create table if not exists quickbooks_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invoice_record_id uuid references invoice_records(id) on delete set null,
  ap_record_id uuid references accounts_payable_records(id) on delete set null,
  client text,
  vendor_customer text,
  invoice_number text,
  qb_bill_number text,
  qb_invoice_number text,
  qb_entry_date date,
  qb_amount numeric,
  qb_status text default 'Not Started',
  qb_url text,
  entered_by text,
  reviewed_by text,
  review_date date,
  notes text
);

create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  run_name text,
  week_start_date date,
  week_end_date date,
  processing_date date,
  status text default 'Draft',
  notes text
);

create table if not exists payroll_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payroll_run_id uuid references payroll_runs(id) on delete cascade,
  week date,
  employee text,
  assignment text,
  worker_type text,
  lob text,
  client text,
  invoice_number text,
  billed_reg numeric,
  total_expense_billing numeric,
  billed_total numeric,
  pay_rate_reg numeric,
  pay_rate_ot numeric,
  reg_hours numeric,
  ot_holiday_hours numeric,
  ot_holiday_pay numeric,
  reimbursable_expenses numeric,
  gross_pay numeric,
  gm_calc_gross_pay numeric,
  employee_payroll_taxes numeric,
  other_deductions numeric,
  net_pay numeric,
  employer_payroll_taxes numeric,
  workers_comp numeric,
  status text default 'Draft',
  processing_date date
);

create table if not exists settings_reference_values (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  category text not null,
  value text not null,
  sort_order int,
  active boolean not null default true
);

create table if not exists import_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payroll_run_id uuid references payroll_runs(id) on delete set null,
  filename text,
  rows_imported int,
  rows_failed int,
  import_status text,
  imported_by text,
  notes text
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table employees enable row level security;
alter table clients enable row level security;
alter table invoice_records enable row level security;
alter table accounts_payable_records enable row level security;
alter table quickbooks_records enable row level security;
alter table payroll_runs enable row level security;
alter table payroll_entries enable row level security;
alter table settings_reference_values enable row level security;
alter table import_history enable row level security;
alter table client_locations enable row level security;

-- ─────────────────────────────────────────────
-- Policies: authenticated users can read/write all tables
-- ─────────────────────────────────────────────

-- employees
create policy "auth select employees" on employees for select to authenticated using (true);
create policy "auth insert employees" on employees for insert to authenticated with check (true);
create policy "auth update employees" on employees for update to authenticated using (true) with check (true);
create policy "auth delete employees" on employees for delete to authenticated using (true);

-- clients
create policy "auth select clients" on clients for select to authenticated using (true);

create policy "auth insert clients" on clients for insert to authenticated with check (true);
create policy "auth update clients" on clients for update to authenticated using (true) with check (true);
create policy "auth delete clients" on clients for delete to authenticated using (true);

-- client_locations
create policy "auth select client_locations" on client_locations for select to authenticated using (true);
create policy "auth insert client_locations" on client_locations for insert to authenticated with check (true);
create policy "auth update client_locations" on client_locations for update to authenticated using (true) with check (true);
create policy "auth delete client_locations" on client_locations for delete to authenticated using (true);

-- invoice_records
create policy "auth select invoice_records" on invoice_records for select to authenticated using (true);
create policy "auth insert invoice_records" on invoice_records for insert to authenticated with check (true);
create policy "auth update invoice_records" on invoice_records for update to authenticated using (true) with check (true);
create policy "auth delete invoice_records" on invoice_records for delete to authenticated using (true);

-- accounts_payable_records
create policy "auth select ap" on accounts_payable_records for select to authenticated using (true);
create policy "auth insert ap" on accounts_payable_records for insert to authenticated with check (true);
create policy "auth update ap" on accounts_payable_records for update to authenticated using (true) with check (true);
create policy "auth delete ap" on accounts_payable_records for delete to authenticated using (true);

-- quickbooks_records
create policy "auth select qb" on quickbooks_records for select to authenticated using (true);
create policy "auth insert qb" on quickbooks_records for insert to authenticated with check (true);
create policy "auth update qb" on quickbooks_records for update to authenticated using (true) with check (true);
create policy "auth delete qb" on quickbooks_records for delete to authenticated using (true);

-- payroll_runs
create policy "auth select payroll_runs" on payroll_runs for select to authenticated using (true);
create policy "auth insert payroll_runs" on payroll_runs for insert to authenticated with check (true);
create policy "auth update payroll_runs" on payroll_runs for update to authenticated using (true) with check (true);
create policy "auth delete payroll_runs" on payroll_runs for delete to authenticated using (true);

-- payroll_entries
create policy "auth select payroll_entries" on payroll_entries for select to authenticated using (true);
create policy "auth insert payroll_entries" on payroll_entries for insert to authenticated with check (true);
create policy "auth update payroll_entries" on payroll_entries for update to authenticated using (true) with check (true);
create policy "auth delete payroll_entries" on payroll_entries for delete to authenticated using (true);

-- settings_reference_values
create policy "auth select settings" on settings_reference_values for select to authenticated using (true);
create policy "auth insert settings" on settings_reference_values for insert to authenticated with check (true);
create policy "auth update settings" on settings_reference_values for update to authenticated using (true) with check (true);
create policy "auth delete settings" on settings_reference_values for delete to authenticated using (true);

-- import_history
create policy "auth select import_history" on import_history for select to authenticated using (true);
create policy "auth insert import_history" on import_history for insert to authenticated with check (true);
create policy "auth update import_history" on import_history for update to authenticated using (true) with check (true);
create policy "auth delete import_history" on import_history for delete to authenticated using (true);

-- ─────────────────────────────────────────────
-- Storage
-- ─────────────────────────────────────────────
-- After running this SQL:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket named: invoice-files
-- 3. Set it to private (not public)
-- 4. Add a storage policy allowing authenticated users to upload/download:
--
--    Policy name: auth users invoice-files
--    Allowed operations: SELECT, INSERT, UPDATE, DELETE
--    Target roles: authenticated
--    USING expression: true
--    WITH CHECK expression: true
