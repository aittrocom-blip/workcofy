import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-8">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-solo.png" alt="Workcofy" width={32} height={32} className="md:hidden" />
        <Image
          src="/logov1.png"
          alt="Workcofy"
          width={140}
          height={32}
          className="hidden md:block"
        />
      </Link>
      <nav className="hidden gap-6 text-sm font-medium md:flex">
        <Link href="/">Explorar</Link>
        <Link href="/near-me">Cerca de mí</Link>
        <Link href="/miraflores">Distritos</Link>
      </nav>
      <Link href="/near-me" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
        Usar mi ubicación
      </Link>
    </header>
  )
}
