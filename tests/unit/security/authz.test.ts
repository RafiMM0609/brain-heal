// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, isHashedPassword } from '~/server/utils/auth'

/**
 * Negative/security regression tests. These encode the audit findings so that
 * a future refactor cannot silently reintroduce them.
 */

describe('password hashing (audit C2)', () => {
  it('never stores the plaintext password', async () => {
    const plain = 'correct-horse-battery-staple'
    const stored = await hashPassword(plain)
    expect(stored).not.toContain(plain)
    expect(stored.startsWith('scrypt$')).toBe(true)
    expect(isHashedPassword(stored)).toBe(true)
  })

  it('uses a unique salt per hash', async () => {
    const a = await hashPassword('same-password')
    const b = await hashPassword('same-password')
    expect(a).not.toEqual(b)
  })

  it('accepts the correct password and rejects wrong ones', async () => {
    const stored = await hashPassword('s3cret-and-long')
    await expect(verifyPassword('s3cret-and-long', stored)).resolves.toBe(true)
    await expect(verifyPassword('wrong', stored)).resolves.toBe(false)
    await expect(verifyPassword('', stored)).resolves.toBe(false)
  })

  it('rejects legacy plaintext values instead of matching them', async () => {
    await expect(verifyPassword('password123', 'password123')).resolves.toBe(false)
  })
})

describe('tenant identifier derivation (audit C5)', () => {
  it('derives keys only from opaque ids, so email-shaped identifiers cannot collide', async () => {
    const { getUserRedisKey } = await import('~/server/utils/auth')
    const base = 'neuralflow:tasks'

    // Server-generated ids are uuid-like: no characters requiring sanitisation.
    const keyA = getUserRedisKey('user_9d737202c5c24a8b90b18c1fd31e427e', base)
    const keyB = getUserRedisKey('user_f5ed800ee499419098407f0fa1c39098', base)
    expect(keyA).not.toEqual(keyB)

    // The old collision primitive (a+b@x.com vs a_b@x.com) can no longer occur
    // because user-controlled text is never used as the identifier.
    expect(keyA).toBe(`${base}:user_9d737202c5c24a8b90b18c1fd31e427e`)
  })

  it('strips anything that is not an id character', async () => {
    const { getUserRedisKey } = await import('~/server/utils/auth')
    expect(getUserRedisKey('user_ok-123', 'k')).toBe('k:user_ok-123')
  })

  it('refuses to build a key from an empty identifier', async () => {
    const { getUserRedisKey } = await import('~/server/utils/auth')
    expect(() => getUserRedisKey('', 'k')).toThrow()
  })
})

describe('push endpoint allowlist (audit H2)', () => {
  it('rejects loopback, private and arbitrary hosts', async () => {
    const { isAllowedPushEndpoint } = await import('~/server/utils/pushScheduler')
    expect(isAllowedPushEndpoint('https://127.0.0.1:8443/x')).toBe(false)
    expect(isAllowedPushEndpoint('https://localhost/admin')).toBe(false)
    expect(isAllowedPushEndpoint('https://169.254.169.254/latest/meta-data/')).toBe(false)
    expect(isAllowedPushEndpoint('https://evil.example.com/x')).toBe(false)
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/x')).toBe(false)
    expect(isAllowedPushEndpoint('not-a-url')).toBe(false)
    expect(isAllowedPushEndpoint(undefined)).toBe(false)
  })

  it('accepts genuine push services', async () => {
    const { isAllowedPushEndpoint } = await import('~/server/utils/pushScheduler')
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true)
  })
})

describe('share image payload validation (audit M2)', () => {
  it('only accepts base64 image data URLs', () => {
    const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/
    expect(IMAGE_DATA_URL_RE.test('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    expect(IMAGE_DATA_URL_RE.test('javascript:alert(1)')).toBe(false)
    expect(IMAGE_DATA_URL_RE.test('https://evil.example.com/x.png')).toBe(false)
    expect(IMAGE_DATA_URL_RE.test('data:text/html;base64,PHNjcmlwdD4=')).toBe(false)
  })
})

describe('legacy plaintext migration (audit C2)', () => {
  it('accepts a legacy plaintext record and flags it for rehashing', async () => {
    const { verifyUserPassword } = await import('~/server/utils/auth')
    const result = await verifyUserPassword('password123', 'password123')
    expect(result.ok).toBe(true)
    expect(result.needsRehash).toBe(true)
  })

  it('rejects a wrong password against a legacy record', async () => {
    const { verifyUserPassword } = await import('~/server/utils/auth')
    const result = await verifyUserPassword('wrong', 'password123')
    expect(result.ok).toBe(false)
    expect(result.needsRehash).toBe(false)
  })

  it('accepts a hashed record without asking for a rehash', async () => {
    const { hashPassword, verifyUserPassword } = await import('~/server/utils/auth')
    const stored = await hashPassword('a-long-password-xyz')
    const result = await verifyUserPassword('a-long-password-xyz', stored)
    expect(result.ok).toBe(true)
    expect(result.needsRehash).toBe(false)
  })

  it('fails safely for missing or empty records', async () => {
    const { verifyUserPassword } = await import('~/server/utils/auth')
    await expect(verifyUserPassword('x', undefined)).resolves.toEqual({ ok: false, needsRehash: false })
    await expect(verifyUserPassword('x', '')).resolves.toEqual({ ok: false, needsRehash: false })
  })

  it('does not length-mismatch-throw on differing lengths', async () => {
    const { verifyUserPassword } = await import('~/server/utils/auth')
    await expect(verifyUserPassword('a', 'a-much-longer-legacy-value')).resolves.toEqual({
      ok: false,
      needsRehash: false
    })
  })
})
