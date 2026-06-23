import { createClient } from '@/lib/supabase/server'
import InvoiceEditorClient from './InvoiceEditorClient'
import type { EditorClient, EditorProfile } from '@/lib/editor-types'

export const metadata = { title: 'Invoice Editor' }

const FALLBACK_PROFILE: EditorProfile = {
  id: 'tessen-default',
  name: 'Tessen Payroll USA LLC',
  website: 'tessenpayroll.com',
  addr1: '1309 Coffeen Ave',
  city: 'Sheridan',
  state: 'WY',
  zip: '82801',
  remitEmail: 'finance@tessenpayroll.com',
  isDefault: true,
}

export default async function InvoiceEditorPage() {
  const supabase = await createClient()

  const [{ data: clientRows }, { data: profileRows }, { data: locationRows }] = await Promise.all([
    supabase.from('clients').select('id, client_name').order('client_name'),
    supabase.from('invoice_profiles').select('*').order('is_default', { ascending: false }).order('name'),
    supabase.from('invoice_client_locations').select('*').order('label'),
  ])

  const profiles: EditorProfile[] = profileRows?.length
    ? profileRows.map(p => ({
        id: p.id, name: p.name, website: p.website, remitEmail: p.remit_email,
        addr1: p.addr1, city: p.city, state: p.state, zip: p.zip, isDefault: p.is_default,
      }))
    : [FALLBACK_PROFILE]

  const editorClients: EditorClient[] = (clientRows ?? []).map(c => ({
    id: c.id,
    name: c.client_name ?? '',
    locations: (locationRows ?? [])
      .filter(l => l.client_id === c.id)
      .map(l => ({ id: l.id, label: l.label, line1: l.line1, line2: l.line2 })),
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 flex items-center">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Invoice Editor</h1>
          <p className="text-xs text-slate-500 mt-0.5">Edit and convert PAS invoices to Tessen format</p>
        </div>
        <a
          href="/invoice-editor/settings"
          className="ml-auto text-xs text-slate-500 hover:text-slate-800 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50"
        >
          ⚙ Settings
        </a>
      </div>
      <div className="flex-1 min-h-0">
        <InvoiceEditorClient clients={editorClients} profiles={profiles} />
      </div>
    </div>
  )
}
