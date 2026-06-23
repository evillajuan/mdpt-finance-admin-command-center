import { createClient } from '@/lib/supabase/server'
import InvoiceEditorClient from './InvoiceEditorClient'
import type { EditorClient } from '@/lib/editor-types'

export const metadata = { title: 'Invoice Editor' }

export default async function InvoiceEditorPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase.from('clients').select('id, client_name').order('client_name')

  const editorClients: EditorClient[] = (clients ?? []).map(c => ({
    id: c.id,
    name: c.client_name ?? '',
    locations: [],
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-sm font-semibold text-slate-900">Invoice Editor</h1>
        <p className="text-xs text-slate-500 mt-0.5">Edit and convert PAS invoices to Tessen format</p>
      </div>
      <div className="flex-1 min-h-0">
        <InvoiceEditorClient clients={editorClients} />
      </div>
    </div>
  )
}
