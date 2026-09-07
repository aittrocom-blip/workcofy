import { requireUser } from '@/lib/supabase/serverAuth'
import { ProfileForm } from '@/components/account/ProfileForm'
import { SavedAlertsPanel, type SavedAlertSummary } from '@/components/account/SavedAlertsPanel'
import { SignOutButton } from '@/components/app/SignOutButton'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Configuración | Workcofy',
}

// Everything editable about the account lives here (the existing
// ProfileForm: name, city, country, novedades, avatar) plus alerts and
// sign-out; /perfil is the read-only identity view.
export default async function ConfiguracionPage() {
  const { user, supabase } = await requireUser('/configuracion')

  const [{ data: profile }, { data: savedAlerts }] = await Promise.all([
    supabase.from('profiles').select('name, country, city, marketing_consent, avatar_id, created_at').eq('id', user.id).single(),
    supabase.from('saved_opportunity_alerts').select('id, label, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 md:px-8 md:pt-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Configuración</p>
      <h1 className="mb-5 mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Tu cuenta</h1>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.name ?? ''}
        initialCountry={profile?.country ?? ''}
        initialCity={profile?.city ?? ''}
        initialMarketingConsent={profile?.marketing_consent ?? false}
        initialAvatarId={profile?.avatar_id ?? null}
        joinedAt={profile?.created_at ?? null}
      />

      <div className="mt-10">
        <SavedAlertsPanel alerts={(savedAlerts ?? []) as SavedAlertSummary[]} />
      </div>

      <div className="mt-10 max-w-xs">
        <SignOutButton />
      </div>
    </div>
  )
}
