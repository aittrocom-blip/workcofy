import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS, ACTIVE_CATEGORY_VALUES } from './categories'

describe('categories', () => {
  it('marks cafe, work_cafe, and hotel as active', () => {
    expect(ACTIVE_CATEGORY_VALUES).toEqual(['cafe', 'work_cafe', 'hotel'])
  })

  it('includes reserved future categories as inactive', () => {
    const coworking = CATEGORY_OPTIONS.find((c) => c.value === 'coworking')
    expect(coworking?.active).toBe(false)
  })

  it('includes an active hotel option labeled Lobby Café', () => {
    const hotel = CATEGORY_OPTIONS.find((option) => option.value === 'hotel')
    expect(hotel).toEqual({ value: 'hotel', label: 'Lobby Café', active: true })
  })

  it('labels meeting_room as Sala de reunión', () => {
    const meetingRoom = CATEGORY_OPTIONS.find((option) => option.value === 'meeting_room')
    expect(meetingRoom?.label).toBe('Sala de reunión')
  })
})
