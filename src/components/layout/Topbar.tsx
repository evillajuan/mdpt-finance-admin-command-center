'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

interface Props {
  userEmail?: string | null
}

export function Topbar({ userEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-cream-border bg-white flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-[11px] text-stone-warm tracking-wide hidden sm:block">{userEmail}</span>
        )}
        <div className="w-px h-3.5 bg-cream-border" />
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-[11px] text-stone-warm hover:text-charcoal-900 tracking-wide transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Sign out
        </button>
      </div>
    </header>
  )
}
