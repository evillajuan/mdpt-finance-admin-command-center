'use client'
import { useEffect, useState } from 'react'
import type { EditorClient, EditorLocation } from '@/lib/editor-types'

const F = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="editor-field">
    <span className="editor-label">{label}</span>
    <input {...p} />
  </label>
)

function LocationsPanel({ client, onRefresh }: { client: EditorClient; onRefresh: () => void }) {
  const [locations, setLocations] = useState<EditorLocation[]>(client.locations)
  const [adding, setAdding] = useState(false)
  const [loc, setLoc] = useState({ label: '', line1: '', line2: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => { setLocations(client.locations) }, [client])

  const addLoc = async () => {
    if (!loc.label || !loc.line1) return
    setBusy(true)
    await fetch('/api/invoice-client-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: client.id, ...loc }),
    })
    setLoc({ label: '', line1: '', line2: '' })
    setAdding(false)
    setBusy(false)
    onRefresh()
  }

  const removeLoc = async (id: string) => {
    await fetch(`/api/invoice-client-locations/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="border-t border-[var(--e-rule2)] pt-8">
      <header className="relative mb-7 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--e-ink)] m-0">{client.name}</h2>
          <p className="text-[11px] text-[var(--e-ash)] mt-1">{locations.length} billing location{locations.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="editor-btn text-xs" onClick={() => setAdding(true)}>+ Add Location</button>
      </header>

      <div className="editor-section-title">Billing Locations</div>
      <div className="grid gap-2 mb-6">
        {locations.map(l => (
          <div key={l.id} className="border border-[var(--e-rule)] p-3 relative">
            <b className="text-[12px]">{l.label}</b>
            <div className="text-[var(--e-smoke)] text-[11px] mt-1">{l.line1}{l.line2 && <><br />{l.line2}</>}</div>
            <button
              className="absolute right-3 top-3 border-0 bg-transparent text-[var(--e-danger)] text-xs cursor-pointer"
              onClick={() => removeLoc(l.id)}
            >Remove</button>
          </div>
        ))}
        {locations.length === 0 && !adding && (
          <p className="text-[11px] text-[var(--e-ash)] italic">No billing locations yet. Add one above.</p>
        )}
        {adding && (
          <div className="border border-[var(--e-rule2)] p-3 grid gap-2">
            <F label="Label (e.g. Headquarters)" value={loc.label} onChange={e => setLoc({ ...loc, label: e.target.value })} />
            <F label="Address Line 1" value={loc.line1} onChange={e => setLoc({ ...loc, line1: e.target.value })} />
            <F label="Address Line 2" value={loc.line2} onChange={e => setLoc({ ...loc, line2: e.target.value })} />
            <div className="flex gap-2">
              <button className="editor-btn editor-btn-primary text-xs" disabled={busy || !loc.label || !loc.line1} onClick={addLoc}>
                {busy ? 'Adding…' : 'Add Location'}
              </button>
              <button className="editor-btn text-xs" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientLocations({ initialClients }: { initialClients: EditorClient[] }) {
  const [clients, setClients] = useState(initialClients)
  const [activeId, setActiveId] = useState<string>()
  const [search, setSearch] = useState('')

  const refresh = async () => {
    const locs: (EditorLocation & { client_id: string })[] = await fetch('/api/invoice-client-locations').then(r => r.json())
    setClients(initialClients.map(c => ({
      ...c,
      locations: locs.filter(l => l.client_id === c.id).map(l => ({ id: l.id, label: l.label, line1: l.line1, line2: l.line2 })),
    })))
  }

  // Load locations on mount
  useEffect(() => { refresh() }, [])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const active = clients.find(c => c.id === activeId)

  return (
    <div className="h-full grid grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="editor-pane flex flex-col">
        <div className="p-3 border-b border-[var(--e-rule)]">
          <input
            placeholder="Search clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[var(--e-rule2)] px-2 py-1.5 text-xs outline-none"
          />
        </div>
        <div className="editor-scroll flex-1">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`editor-list-row w-full text-left bg-transparent flex gap-2 items-center ${activeId === c.id ? 'active' : ''}`}
            >
              <span className="w-7 h-7 bg-[var(--e-brass-bg)] text-[var(--e-brass)] grid place-items-center text-sm font-semibold flex-shrink-0">
                {c.name[0]?.toUpperCase()}
              </span>
              <span className="min-w-0">
                <b className="block truncate text-[12px]">{c.name}</b>
                <small className="text-[var(--e-ash)] text-[10px]">{c.locations.length} location{c.locations.length !== 1 ? 's' : ''}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Detail */}
      <section className="editor-scroll px-8 py-6">
        {active
          ? <LocationsPanel client={active} onRefresh={refresh} />
          : <div className="pt-10 text-center text-[var(--e-ash)] italic text-sm">Select a client to manage billing addresses.</div>
        }
      </section>
    </div>
  )
}
