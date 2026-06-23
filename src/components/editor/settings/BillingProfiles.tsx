'use client'
import { useEffect, useState } from 'react'
import type { EditorProfile } from '@/lib/editor-types'

const F = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="editor-field">
    <span className="editor-label">{label}</span>
    <input {...p} />
  </label>
)

function ProfileDetail({
  profile, onSave, onDelete,
}: {
  profile: EditorProfile
  onSave: (p: EditorProfile) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)
  useEffect(() => setForm(profile), [profile])
  const set = (k: keyof EditorProfile, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))
  const save = async (extra: Partial<EditorProfile> = {}) => {
    setSaving(true)
    await onSave({ ...form, ...extra })
    setSaving(false)
  }

  return (
    <div className="border-t border-[var(--e-rule2)] pt-8">
      <header className="relative mb-7">
        <h2 className="text-lg font-semibold text-[var(--e-ink)] m-0">{form.name}</h2>
        {form.isDefault && <span className="editor-badge inline-block mt-2">Default Profile</span>}
        <div className="absolute right-0 top-0 flex gap-2">
          {!form.isDefault && (
            <button className="editor-btn text-xs" onClick={() => save({ isDefault: true })}>Set as Default</button>
          )}
          <button className="editor-btn text-xs text-[var(--e-danger)]" onClick={() => onDelete(form.id)}>Delete</button>
        </div>
      </header>
      <div className="editor-section-title">Company Details</div>
      <div className="grid gap-3 mb-7">
        <F label="Company Name" value={form.name} onChange={e => set('name', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <F label="Website" value={form.website || ''} onChange={e => set('website', e.target.value)} />
          <F label="Remittance Email" type="email" value={form.remitEmail || ''} onChange={e => set('remitEmail', e.target.value)} />
        </div>
      </div>
      <div className="editor-section-title">Mailing Address</div>
      <div className="grid gap-3">
        <F label="Street" value={form.addr1 || ''} onChange={e => set('addr1', e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <F label="City" value={form.city || ''} onChange={e => set('city', e.target.value)} />
          <F label="State" value={form.state || ''} onChange={e => set('state', e.target.value)} />
          <F label="ZIP" value={form.zip || ''} onChange={e => set('zip', e.target.value)} />
        </div>
      </div>
      <button className="editor-btn editor-btn-primary mt-6 text-xs" disabled={saving} onClick={() => save()}>
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  )
}

export default function BillingProfiles() {
  const [profiles, setProfiles] = useState<EditorProfile[]>([])
  const [activeId, setActiveId] = useState<string>()
  const [toast, setToast] = useState('')

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = async () => {
    const data = await fetch('/api/invoice-profiles').then(r => r.json())
    setProfiles(data)
    if (!activeId && data.length) setActiveId((data.find((p: EditorProfile) => p.isDefault) || data[0]).id)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    const p = await fetch('/api/invoice-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Company Profile', is_default: profiles.length === 0 }),
    }).then(r => r.json())
    await load()
    setActiveId(p.id)
  }

  const handleSave = async (profile: EditorProfile) => {
    await fetch(`/api/invoice-profiles/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.name, website: profile.website, remit_email: profile.remitEmail,
        addr1: profile.addr1, city: profile.city, state: profile.state, zip: profile.zip,
        is_default: profile.isDefault,
      }),
    })
    await load()
    notify('Profile saved')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return
    await fetch(`/api/invoice-profiles/${id}`, { method: 'DELETE' })
    setActiveId(undefined)
    await load()
    notify('Profile deleted')
  }

  const active = profiles.find(p => p.id === activeId)

  return (
    <div className="h-full grid grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="editor-pane flex flex-col">
        <div className="editor-section-title m-3 mb-0">Company Profiles</div>
        <div className="editor-scroll flex-1">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`editor-list-row w-full text-left bg-transparent relative ${activeId === p.id ? 'active' : ''}`}
            >
              <b className="text-[12px] block pr-7 truncate">{p.name}</b>
              {p.isDefault && <span className="editor-badge inline-block mt-2">Default</span>}
              <span
                role="button"
                className="editor-hover-x text-[var(--e-danger)]"
                onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
              >×</span>
            </button>
          ))}
        </div>
        <button className="editor-btn m-3 text-xs" onClick={create}>+ New Profile</button>
      </aside>

      {/* Detail */}
      <section className="editor-scroll px-8 py-6">
        {active
          ? <ProfileDetail profile={active} onSave={handleSave} onDelete={handleDelete} />
          : <div className="pt-10 text-center text-[var(--e-ash)] italic text-sm">Create a company profile to begin.</div>
        }
      </section>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 bg-slate-900 text-white px-4 py-3 text-sm shadow-xl">{toast}</div>
      )}
    </div>
  )
}
