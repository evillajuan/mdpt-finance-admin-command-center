import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: values } = await supabase
    .from('settings_reference_values')
    .select('*')
    .order('category')
    .order('sort_order')
    .order('value')

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage reference lists and configuration values" />
      <SettingsClient initialValues={values ?? []} />
    </div>
  )
}
