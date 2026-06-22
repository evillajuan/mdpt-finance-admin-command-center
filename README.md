# Finance Admin Command Center

Internal finance operations control center for managing invoice conversion, accounts payable, QuickBooks tracking, and payroll runs.

## Web-Based Setup (No Local Terminal Required)

All setup steps below can be completed entirely in the browser.

---

### Step 1 — Create a GitHub Repository

If you haven't already, create a new GitHub repository and push this code to it. You can use GitHub Codespaces or Claude Code Web to develop and edit the project.

---

### Step 2 — Build and Edit Through Claude Code Web or GitHub Codespaces

- **Claude Code Web**: Open [claude.ai/code](https://claude.ai/code) and connect this repository to make code changes.
- **GitHub Codespaces**: Open the repository on GitHub, click **Code → Codespaces → Create codespace** to get a browser-based editor.

---

### Step 3 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project** and fill in the project name and database password.
3. Wait for the project to finish provisioning (about 1 minute).

---

### Step 4 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open `supabase-schema.sql` from this repository and paste the entire contents into the SQL editor.
4. Click **Run** to create all tables, enable RLS, and set up policies.

---

### Step 5 — Create the Invoice Files Storage Bucket

1. In Supabase, go to **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name it exactly: `invoice-files`
4. Keep it **private** (not public).
5. After creating the bucket, go to **Policies** under the bucket and add a new policy:
   - **Policy name**: `auth users invoice-files`
   - **Allowed operations**: SELECT, INSERT, UPDATE, DELETE
   - **Target roles**: `authenticated`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`

---

### Step 6 — Enable Email/Password Authentication

1. In Supabase, go to **Authentication → Providers**.
2. Ensure **Email** is enabled.
3. Go to **Authentication → Users** and click **Invite user** (or **Add user**) to create your first admin account.

---

### Step 7 — Import the Repository into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Connect your GitHub account and select this repository.
4. Vercel will auto-detect it as a Next.js project.

---

### Step 8 — Add Environment Variables in Vercel

Before deploying, add these environment variables in the Vercel project settings:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → `anon` `public` key |

In Vercel: go to your project → **Settings → Environment Variables** and add both variables for **Production**, **Preview**, and **Development**.

---

### Step 9 — Deploy

Click **Deploy** in Vercel. The build will run and your app will be live at a `*.vercel.app` URL in about 1–2 minutes.

---

### Step 10 — Test the App

After deployment, verify the following:

- [ ] Navigate to your Vercel URL — you should be redirected to `/login`
- [ ] Sign in with the user you created in Supabase Auth
- [ ] Dashboard loads with stat cards (all zeros initially)
- [ ] Create a new invoice record in Invoice Conversion
- [ ] Upload a PAS invoice file — file should save to Supabase Storage
- [ ] Create a payroll run in Payroll Runs
- [ ] Import a CSV file using the Import CSV button
- [ ] Verify payroll rows appear with calculated fields
- [ ] Check the Dashboard updates with the new data
- [ ] Test the Settings page — add a reference value

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage |
| CSV Import | PapaParse |
| Icons | lucide-react |
| Deployment | Vercel |

## Security Notes

- No SSNs, bank account numbers, or government IDs are stored in any table
- All tables have Row Level Security enabled
- Unauthenticated users are redirected to `/login` by middleware
- Authenticated users have full read/write access (V1 — single-team use)
- Supabase Storage bucket is private; files require authenticated access

## Module Overview

| Route | Purpose |
|-------|---------|
| `/dashboard` | KPI cards + workflow overview table |
| `/invoice-conversion` | PAS → Tessen invoice tracking |
| `/accounts-payable` | Asana AP task tracking |
| `/quickbooks` | QuickBooks entry tracking |
| `/payroll-runs` | Payroll run management + CSV import |
| `/people` | Employee / contractor records |
| `/clients` | Client account settings |
| `/settings` | Reference list management |
