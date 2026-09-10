'use client'

import { useEffect, useState } from 'react'

export type ActionToastDetail = { message: string }

export function showActionToast(message: string) {
  window.dispatchEvent(new CustomEvent<ActionToastDetail>('workcofy:toast', { detail: { message } }))
}

export function ActionToast() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const show = (event: Event) => {
      const detail = (event as CustomEvent<ActionToastDetail>).detail
      if (!detail?.message) return
      setMessage(detail.message)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setMessage(''), 2800)
    }
    window.addEventListener('workcofy:toast', show)
    return () => {
      window.removeEventListener('workcofy:toast', show)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!message) return null
  return (
    <div role="status" aria-live="polite" className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white shadow-lg md:bottom-6">
      {message}
    </div>
  )
}
