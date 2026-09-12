'use client'

import { QRCodeSVG } from 'qrcode.react'

export function SpaceQrCode({ slug }: { slug: string }) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const value = `${origin}/check-in/${slug}`
  function downloadJpg() {
    const svg = document.querySelector('[data-workcofy-qr]') as SVGSVGElement | null
    if (!svg) return
    const source = new XMLSerializer().serializeToString(svg)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 820
      const context = canvas.getContext('2d')
      if (!context) return
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#0a0a0a'
      context.font = '700 34px Arial'
      context.textAlign = 'center'
      context.fillText('WORKCOFY', canvas.width / 2, 65)
      context.drawImage(image, 110, 105, 480, 480)
      context.font = '600 25px Arial'
      context.fillText('Escanea para hacer check-in', canvas.width / 2, 650)
      context.font = '400 20px Arial'
      context.fillStyle = '#666666'
      context.fillText('Activa tus beneficios en este local', canvas.width / 2, 690)
      const link = document.createElement('a')
      link.download = `workcofy-checkin-${slug}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.92)
      link.click()
    }
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
  }

  return <section className="mt-8 border-t border-gray-100 pt-8"><h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">QR de check-in</h2><p className="mt-2 text-sm text-gray-500">Coloca este código en el mostrador o las mesas del local.</p><div className="mt-4 inline-flex rounded-2xl border border-gray-200 bg-white p-3"><QRCodeSVG data-workcofy-qr="true" value={value} size={180} level="M" /></div><div><button type="button" onClick={downloadJpg} className="mt-3 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-black">Descargar JPG</button></div><p className="mt-2 break-all text-xs text-gray-400">{value}</p></section>
}
