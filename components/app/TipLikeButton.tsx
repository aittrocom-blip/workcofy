'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function TipLikeButton({ tipId, title }: { tipId: string; title: string }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)

  useEffect(() => {
    let active = true
    setError('')
    async function load() {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        const [total, mine] = await Promise.all([
          supabase.from('tips').select('like_count').eq('id', tipId).single(),
          user ? supabase.from('tip_likes').select('tip_id').eq('tip_id', tipId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        ])
        if (total.error || mine.error) throw total.error || mine.error
        if (active) {
          setCount(total.data.like_count)
          setLiked(Boolean(mine.data))
          setReady(true)
        }
      } catch {
        if (active) setReady(false)
      }
    }
    void load()
    return () => { active = false }
  }, [tipId])

  async function toggle() {
    if (busy.current || !ready) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Inicia sesión para dar me gusta.')
        return
      }
      const result = liked
        ? await supabase.from('tip_likes').delete().eq('tip_id', tipId).eq('user_id', user.id)
        : await supabase.from('tip_likes').upsert({ tip_id: tipId, user_id: user.id }, { onConflict: 'user_id,tip_id', ignoreDuplicates: true })
      if (result.error) throw result.error
      setLiked(!liked)
      setCount(value => Math.max(0, (value ?? 0) + (liked ? -1 : 1)))
      const total = await supabase.from('tips').select('like_count').eq('id', tipId).single()
      if (!total.error) setCount(total.data.like_count)
    } catch {
      setError('No se pudo guardar. Inténtalo otra vez.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <div className="mt-auto flex flex-col items-end pt-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!ready || pending}
        aria-pressed={liked}
        aria-label={`${liked ? 'Quitar me gusta' : 'Me gusta'}: ${title}`}
        title={liked ? 'Quitar me gusta' : 'Este tip me sirve'}
        className={`inline-flex min-h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workcofy-yellow disabled:opacity-50 ${liked ? 'bg-workcofy-yellow text-black' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-workcofy-yellow'}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M7 10v11H3V10h4Zm0 0 5-8a3 3 0 0 1 2 4l-1 4h6a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 21H7" />
        </svg>
        {count !== null && <span className="tabular-nums">{count}</span>}
      </button>
      {ready && error && <p role="status" className="mt-1 max-w-full text-right text-[11px] text-white/70">{error}</p>}
    </div>
  )
}
