'use client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import BillingProfiles from '@/components/editor/settings/BillingProfiles'
import ClientLocations from '@/components/editor/settings/ClientLocations'
import type { EditorClient } from '@/lib/editor-types'
import { createClient } from '@/lib/supabase/client'

function SettingsContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'profiles'
  const [clients, setClients] = useState<EditorClient[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('clients').select('id, client_name').order('client_name').then(({ data }) => {
      if (!data) return
      setClients(data.map(c => ({ id: c.id, name: c.client_name ?? '', locations: [] })))
    })
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 flex items-center gap-4">
        <div>
          <Link href="/invoice-editor" className="text-xs text-slate-400 hover:text-slate-600">← Invoice Editor</Link>
          <h1 className="text-sm font-semibold text-slate-900 mt-0.5">Invoice Editor Settings</h1>
        </div>
        <div className="ml-auto flex gap-1">
          <Link
            href="/invoice-editor/settings?tab=profiles"
            className={`px-3 py-1.5 text-xs rounded ${tab === 'profiles' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Billing Profiles
          </Link>
          <Link
            href="/invoice-editor/settings?tab=addresses"
            className={`px-3 py-1.5 text-xs rounded ${tab === 'addresses' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Client Addresses
          </Link>
        </div>
      </div>
      <div className="flex-1 min-h-0" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
        {tab === 'profiles' && <BillingProfiles />}
        {tab === 'addresses' && <ClientLocations initialClients={clients} />}
      </div>
    </div>
  )
}

export default function InvoiceEditorSettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
