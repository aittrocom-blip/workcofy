'use client'

import { QRCodeSVG } from 'qrcode.react'

export function SpaceQrCode({ slug }: { slug: string }) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const value = `${origin}/check-in/${slug}`
  return <section className="mt-8 border-t border-gray-100 pt-8"><h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">QR de check-in</h2><p className="mt-2 text-sm text-gray-500">Coloca este código en el mostrador o las mesas del local.</p><div className="mt-4 inline-flex rounded-2xl border border-gray-200 bg-white p-3"><QRCodeSVG value={value} size={180} level="M" /></div><p className="mt-2 break-all text-xs text-gray-400">{value}</p></section>
}
