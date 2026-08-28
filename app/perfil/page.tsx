import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProfileForm } from '@/components/account/ProfileForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi perfil | Workcofy',
}

export default async function PerfilPage() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Nothing here needs to write cookies — middleware.ts owns session refresh on navigation.
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/perfil')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, country, city, marketing_consent')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
      <p className="mt-1 text-sm text-gray-500">{user.email}</p>
      <ProfileForm
        initialName={profile?.name ?? ''}
        initialCountry={profile?.country ?? ''}
        initialCity={profile?.city ?? ''}
        initialMarketingConsent={profile?.marketing_consent ?? false}
      />
    </div>
  )
}
