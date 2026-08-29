'use client'

import { AVATAR_OPTIONS } from '@/lib/avatars'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface AvatarPickerModalProps {
  userId: string
  onPicked: (avatarId: string) => void
}

export function AvatarPickerModal({ userId, onPicked }: AvatarPickerModalProps) {
  async function pick(avatarId: string) {
    const supabase = createBrowserSupabaseClient()
    await supabase.from('profiles').update({ avatar_id: avatarId }).eq('id', userId)
    onPicked(avatarId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-lg font-bold tracking-tight">Elige tu avatar</h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => pick(option.id)}
              aria-label={option.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 p-3 transition-colors hover:border-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={option.src}
                alt={option.label}
                className="h-16 w-16 rounded-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
