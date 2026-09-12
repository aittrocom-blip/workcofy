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
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Workcofy Check-in</p>
    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{space.name}</h1>
    <p className="mt-1 text-sm text-gray-500">{districtLabel(space.district)}</p>
    <section className="mt-8 rounded-3xl bg-black p-6 text-white">
      <p className="text-sm text-white/70">Confirma que estás en el local para activar tus beneficios.</p>
      <CheckInButton spaceId={space.id} className="mt-5 inline-flex rounded-full bg-workcofy-yellow px-5 py-3 text-sm font-bold text-black" />
    </section>
    <section className="mt-6">
      <h2 className="text-lg font-bold">Beneficios disponibles</h2>
      {benefits.length === 0 ? <p className="mt-2 text-sm text-gray-500">Este local aún no tiene beneficios publicados.</p> : <ul className="mt-3 flex flex-col gap-2">{benefits.map((benefit) => <li key={benefit.id} className="rounded-2xl border border-gray-100 p-4"><span className="mr-2">{benefit.icon ?? '🎁'}</span><span className="text-sm font-semibold">{benefit.label}</span></li>)}</ul>}
    </section>
  </main>
}
