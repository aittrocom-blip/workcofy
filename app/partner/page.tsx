import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/supabase/serverAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { PartnerDashboard } from './PartnerDashboard'
import { ChangePartnerPassword } from './ChangePartnerPassword'

export const dynamic = 'force-dynamic'

export default async function PartnerPage() {
  const { user } = await requireUser('/partner')
  const admin = createAdminSupabaseClient()
  const { data: account } = await admin.from('partner_accounts').select('id, space_id, username, force_password_change').eq('user_id', user.id).eq('active', true).single()
  if (!account) redirect('/app')
  const { data: space } = await admin.from('spaces').select('id, name, instagram_url, tiktok_url').eq('id', account.space_id).single()
  if (!space) redirect('/app')
  if (account.force_password_change) return <main className="mx-auto max-w-xl px-4 py-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Workcofy Partner</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">{space.name}</h1><ChangePartnerPassword /></main>
  const { data: promotions } = await admin.from('partner_promotions').select('id, title, description, active').eq('space_id', space.id).order('created_at', { ascending: false })
  const { count } = await admin.from('partner_scan_events').select('id', { count: 'exact', head: true }).eq('space_id', space.id).eq('event_type', 'qr_scan')
  return <main className="mx-auto max-w-xl px-4 py-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Workcofy Partner</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">{space.name}</h1><p className="mt-2 text-sm text-gray-500">Usuario: {account.username}</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black p-4 text-white"><p className="text-xs text-white/60">Escaneos QR</p><p className="mt-1 text-3xl font-extrabold">{count ?? 0}</p></div><div className="rounded-2xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Promociones</p><p className="mt-1 text-3xl font-extrabold">{promotions?.filter(p => p.active).length ?? 0}</p></div></div><PartnerDashboard space={space} /><section className="mt-5 rounded-3xl bg-gray-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Publicadas</p>{!promotions?.length ? <p className="mt-3 text-sm text-gray-500">Todavía no hay promociones.</p> : <ul className="mt-3 space-y-2">{promotions.map(p => <li key={p.id} className="rounded-xl bg-white p-3"><p className="text-sm font-bold">{p.title}</p><p className="text-xs text-gray-500">{p.description}</p></li>)}</ul>}</section></main>
}
