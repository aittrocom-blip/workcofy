import { notFound } from 'next/navigation'
import { getSpaceBySlug } from '@/lib/data/spaces'
import { listSpaceBenefits } from '@/lib/data/benefits'
import { CheckInButton } from '@/components/space/CheckInButton'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

export default async function CheckInPage({ params }: { params: { slug: string } }) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) notFound()
  const benefits = await listSpaceBenefits(space.id)
  return <main className="mx-auto min-h-screen max-w-md bg-white px-5 pb-10 pt-7">
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2"><img src="/logo-solo.png" alt="" className="h-8 w-8 object-contain" /><span className="text-sm font-extrabold tracking-tight">WORKCOFY</span></div>
      <span className="rounded-full bg-workcofy-yellow/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">Check-in</span>
    </header>
    <section className="mt-10">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Estás en</p>
      <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight">{space.name}</h1>
      <p className="mt-2 text-sm text-gray-500">{districtLabel(space.district)}{space.address ? ` · ${space.address}` : ''}</p>
    </section>
    <section className="mt-8 overflow-hidden rounded-[28px] bg-black p-6 text-white shadow-xl shadow-black/10">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-workcofy-yellow text-xl">📍</span><div><h2 className="font-bold">Confirma tu visita</h2><p className="mt-1 text-sm leading-relaxed text-white/65">Permite tu ubicación para activar los beneficios de este local.</p></div></div>
      <CheckInButton spaceId={space.id} className="mt-6 flex w-full items-center justify-center rounded-full bg-workcofy-yellow px-5 py-3.5 text-sm font-bold text-black transition-transform active:scale-[0.98]" />
      <p className="mt-3 text-center text-[11px] text-white/40">Solo puedes hacer un check-in diario en este local</p>
    </section>
    <section className="mt-9">
      <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Después del check-in</p><h2 className="mt-1 text-xl font-extrabold tracking-tight">Tus beneficios</h2></div><span className="text-xl">🎁</span></div>
      {benefits.length === 0 ? <p className="mt-3 rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">Este local aún no tiene beneficios publicados.</p> : <ul className="mt-3 flex flex-col gap-2">{benefits.map((benefit) => <li key={benefit.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">{benefit.icon ?? '🎁'}</span><span className="text-sm font-semibold">{benefit.label}</span></li>)}</ul>}
    </section>
    <p className="mt-10 text-center text-xs text-gray-400">Tu ciudad. Tu ecosistema.</p>
  </main>
}
