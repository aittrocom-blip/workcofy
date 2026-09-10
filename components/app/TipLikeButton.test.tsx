import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TipLikeButton } from './TipLikeButton'

const mocks = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn() }))
vi.mock('@/lib/supabase/browserClient', () => ({
  createBrowserSupabaseClient: () => ({ from: mocks.from, auth: { getUser: mocks.getUser } }),
}))

describe('TipLikeButton', () => {
  let total: number
  let saved: boolean
  let fail: boolean
  let insert: ReturnType<typeof vi.fn>
  let remove: ReturnType<typeof vi.fn>

  beforeEach(() => {
    total = 3
    saved = false
    fail = false
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'member' } }, error: null })
    insert = vi.fn(() => {
      if (fail) return Promise.resolve({ error: new Error('offline') })
      saved = true
      total++
      return Promise.resolve({ error: null })
    })
    remove = vi.fn(() => {
      saved = false
      total--
      const query = { eq: () => query, then: (resolve: (value: unknown) => void) => resolve({ error: null }) }
      return query
    })
    mocks.from.mockImplementation((table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        single: async () => ({ data: { like_count: total }, error: null }),
        maybeSingle: async () => ({ data: saved ? { tip_id: 'tip' } : null, error: null }),
        upsert: insert,
        delete: remove,
      }
      return query
    })
  })

  it('saves a like and lets the member remove it', async () => {
    render(<TipLikeButton tipId="tip" title="Un consejo" />)
    const button = screen.getByRole('button')
    await waitFor(() => expect(button).toBeEnabled())
    expect(button).toHaveTextContent('3')
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
    expect(button).toHaveTextContent('4')
    expect(insert).toHaveBeenCalledWith({ tip_id: 'tip', user_id: 'member' }, { onConflict: 'user_id,tip_id', ignoreDuplicates: true })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveTextContent('3')
    expect(remove).toHaveBeenCalledOnce()
  })

  it('keeps the count and selection unchanged when saving fails', async () => {
    fail = true
    render(<TipLikeButton tipId="tip" title="Un consejo" />)
    const button = screen.getByRole('button')
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    expect(await screen.findByRole('status')).toHaveTextContent('No se pudo guardar')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveTextContent('3')
  })

  it('restores a previously saved like', async () => {
    saved = true
    render(<TipLikeButton tipId="tip" title="Un consejo" />)
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true'))
  })
})
