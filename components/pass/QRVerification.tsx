'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRVerificationProps {
  value: string
  size?: number
  caption?: string
}

// The scannable half of the Pass. Encodes passQrPayload() (a member URL);
// the validator behind that URL is the pending backend piece — swapping the
// payload is a one-line change in lib/pass.ts, nothing here.
export function QRVerification({ value, size = 96, caption = 'Scan to verify' }: QRVerificationProps) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-2.5">
        <QRCodeSVG value={value} size={size} level="M" bgColor="#ffffff" fgColor="#0a0a0a" marginSize={0} />
      </div>
      <figcaption className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">{caption}</figcaption>
    </figure>
  )
}
