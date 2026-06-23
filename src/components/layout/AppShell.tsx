import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface Props {
  children: React.ReactNode
  userEmail?: string | null
}

export function AppShell({ children, userEmail }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
