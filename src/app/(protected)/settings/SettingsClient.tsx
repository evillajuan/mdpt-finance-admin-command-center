'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SectionCard } from '@/components/ui/SectionCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { SettingsReferenceValue } from '@/lib/types'

const CATEGORIES = [
  'Companies / Entities',
  'Clients',
  'LOBs',
  'Assignments',
  'Worker Types',
  'Work States',
  'Tax States',
  'Classifications',
  'Invoice Conversion Statuses',
  'AP Statuses',
  'QuickBooks Statuses',
  'Payroll Statuses',
]

interface Props { initialValues: SettingsReferenceValue[] }

export default function SettingsClient({ initialValues }: Props) {
  const supabase = createClient()
  const [values, setValues] = useState(initialValues)
  const [newValues, setNewValues] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<SettingsReferenceValue | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const byCategory = CATEGORIES.reduce<Record<string, SettingsReferenceValue[]>>((acc, cat) => {
    acc[cat] = values.filter((v) => v.category === cat && v.active)
    return acc
  }, {})

  const handleAdd = async (category: string) => {
    const val = newValues[category]?.trim()
    if (!val) return
    setSaving(category)
    try {
      const { data, error } = await supabase.from('settings_reference_values').insert({
        category, value: val, active: true, updated_at: new Date().toISOString(),
      }).select().single()
      if (error) throw error
      setValues((prev) => [...prev, data])
      setNewValues((prev) => ({ ...prev, [category]: '' }))
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('settings_reference_values').update({ active: false, updated_at: new Date().toISOString() }).eq('id', deleteTarget.id)
    if (!error) setValues((prev) => prev.filter((v) => v.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <SectionCard key={cat} title={cat}>
            <div className="px-4 pb-3">
              <div className="divide-y divide-gray-100 mb-2">
                {byCategory[cat].length === 0 && (
                  <p className="py-3 text-xs text-gray-400 text-center">No values yet</p>
                )}
                {byCategory[cat].map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700">{v.value}</span>
                    <button onClick={() => setDeleteTarget(v)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newValues[cat] ?? ''}
                  onChange={(e) => setNewValues((prev) => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd(cat))}
                  placeholder="Add value…"
                  className="flex-1 h-7 border border-gray-200 rounded px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <button
                  onClick={() => handleAdd(cat)}
                  disabled={saving === cat || !newValues[cat]?.trim()}
                  className="h-7 px-2 bg-slate-900 text-white text-xs rounded hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove value"
        message={`Remove "${deleteTarget?.value}" from ${deleteTarget?.category}?`}
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
