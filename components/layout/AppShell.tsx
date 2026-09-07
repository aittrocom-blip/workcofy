'use client'

import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { PublicShell } from '@/components/layout/PublicShell'
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell'

interface AppShellProps {
  /** Resolved server-side by middleware (see RootLayout) so the first paint already shows the right shell. */
  initialUserId: string | null
  children: React.ReactNode
}

// The one fork between the two Workcofy experiences: signed out → the public
// website (Header + Footer); signed in → the mobile-first app (MobileHeader +
// BottomNavigation). Server value wins until the browser session resolves,
// then the live auth state takes over (so logout flips the shell in place).
export function AppShell({ initialUserId, children }: AppShellProps) {
  const { user, loading } = useAuthUser()
  const authenticated = loading ? initialUserId !== null : user !== null

  if (authenticated) return <AuthenticatedShell>{children}</AuthenticatedShell>
  return <PublicShell>{children}</PublicShell>
}
