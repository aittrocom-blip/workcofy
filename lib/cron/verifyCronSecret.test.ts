import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { verifyCronSecret } from './verifyCronSecret'

const TEST_SECRET = 'test-secret'
const AUTH_SCHEME = 'Bearer'

function authHeader(token: string): string {
  return [AUTH_SCHEME, token].join(' ')
}

describe('verifyCronSecret', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    process.env.CRON_SECRET = TEST_SECRET
  })
  afterEach(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('accepts a matching bearer token', () => {
    const request = new Request('https://x/api/cron/foo', { headers: { authorization: authHeader(TEST_SECRET) } })
    expect(verifyCronSecret(request)).toBe(true)
  })

  it('rejects a missing or wrong token', () => {
    expect(verifyCronSecret(new Request('https://x/api/cron/foo'))).toBe(false)
    expect(verifyCronSecret(new Request('https://x/api/cron/foo', { headers: { authorization: authHeader('wrong') } }))).toBe(false)
  })

  it('fails closed when CRON_SECRET is not configured', () => {
    delete process.env.CRON_SECRET
    const request = new Request('https://x/api/cron/foo', { headers: { authorization: authHeader(TEST_SECRET) } })
    expect(verifyCronSecret(request)).toBe(false)
  })
})
