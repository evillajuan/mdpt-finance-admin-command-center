'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-[10px] font-medium text-gold-muted uppercase tracking-[0.2em]">Finance Admin</p>
          <h1 className="font-display text-3xl font-medium text-charcoal-900 mt-2 tracking-wide">Command Center</h1>
          <div className="mt-3 flex justify-center">
            <div className="w-8 h-px bg-gold opacity-60" />
          </div>
          <p className="text-xs text-stone-warm mt-3 tracking-wide">Sign in to access your workspace</p>
        </div>
        <div className="bg-white border border-cream-border rounded-lg p-7 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-medium text-stone-warm uppercase tracking-[0.12em] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-9 border border-cream-border rounded px-3 text-sm text-charcoal-900 bg-white placeholder:text-stone-warm focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-stone-warm uppercase tracking-[0.12em] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-9 border border-cream-border rounded px-3 text-sm text-charcoal-900 bg-white focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-colors"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-charcoal-900 text-white text-xs font-medium uppercase tracking-[0.15em] rounded hover:bg-charcoal-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
