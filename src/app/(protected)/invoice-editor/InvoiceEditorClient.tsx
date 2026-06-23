'use client'
import { useState } from 'react'
import EditorView from '@/components/editor/EditorView'
import type { EditorClient, EditorProfile } from '@/lib/editor-types'

const DEFAULT_PROFILES: EditorProfile[] = [
  {
    id: 'tessen-default',
    name: 'Tessen Payroll USA LLC',
    website: 'tessenpayroll.com',
    addr1: '1309 Coffeen Ave',
    city: 'Sheridan',
    state: 'WY',
    zip: '82801',
    remitEmail: 'finance@tessenpayroll.com',
    isDefault: true,
  },
]

export default function InvoiceEditorClient({ clients }: { clients: EditorClient[] }) {
  const [toast, setToast] = useState('')

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      <EditorView clients={clients} profiles={DEFAULT_PROFILES} notify={notify} />
      {toast && (
        <div className="fixed right-6 bottom-20 z-50 bg-slate-900 text-white px-4 py-3 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
