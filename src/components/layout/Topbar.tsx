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
    <header className="h-12 flex items-center justify-between px-5 border-b border-gray-200 bg-white flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
