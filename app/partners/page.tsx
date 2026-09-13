import { PartnerLogin } from './PartnerLogin'

export const metadata = { title: 'Acceso Partner | Workcofy' }

export default function PartnersPage() {
  return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12"><div className="w-full max-w-md"><p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-gray-400">Workcofy Partners</p><h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight">Acceso para tu local</h1><p className="mt-3 text-center text-sm leading-relaxed text-gray-600">Ingresa con el usuario y la clave que te entregó Workcofy para administrar la información de tu cafetería.</p><PartnerLogin /></div></main>
}
