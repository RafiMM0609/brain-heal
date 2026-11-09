import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'
import { redisGet, redisSet, redisDel } from './redis'

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>

// ---------------------------------------------------------------------------
// Password hashing (scrypt, no external dependency)
// ---------------------------------------------------------------------------

const SCRYPT_KEYLEN = 64
const SCRYPT_SALT_BYTES = 16

/**
 * Hash a plaintext password into a self-describing string:
 *   scrypt$<saltHex>$<hashHex>
 * The salt is random per password, so identical passwords yield distinct hashes.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES)
  const derived = await scrypt(plain, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

/**
 * Verify a plaintext password against a stored hash.
 * Returns false (never throws) for malformed hashes or unsupported formats,
 * so callers can treat every failure mode as a generic auth failure.
 */
export async function verifyPassword(plain: string, stored: string | undefined | null): Promise<boolean> {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false
  const parts = stored.split('$')
  if (parts.length !== 3) return false

  const [, saltHex, hashHex] = parts
  let expected: Buffer
  try {
    expected = Buffer.from(hashHex, 'hex')
  } catch {
    return false
  }
  if (expected.length !== SCRYPT_KEYLEN) return false

  try {
    const derived = await scrypt(plain, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN)
    // Constant-time comparison to avoid leaking hash bytes via timing.
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/** True if the stored value looks like a hash we produced (used for lazy migration). */
export function isHashedPassword(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt$')
}

// ---------------------------------------------------------------------------
// Session model
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = 'nf_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const SESSION_KEY_PREFIX = 'neuralflow:session:'

export interface SessionUser {
  id: string
  name: string
  email?: string
  isGuest: boolean
  avatarUrl: string
  state: 'Relaxed Alertness' | 'Deep Focus' | 'Recharge'
}

export interface StoredSession {
  token: string
  userId: string
  isGuest: boolean
  createdAt: number
  expiresAt: number
}

function sessionKey(token: string): string {
  return `${SESSION_KEY_PREFIX}${token}`
}

/**
 * Session tokens are opaque 256-bit random values. They are NOT derived from
 * user input, so they cannot be forged or enumerated.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createSession(userId: string, isGuest: boolean): Promise<StoredSession> {
  const token = generateSessionToken()
  const now = Date.now()
  const session: StoredSession = {
    token,
    userId,
    isGuest,
    createdAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000
  }
  await redisSet(sessionKey(token), session, SESSION_TTL_SECONDS)
  return session
}

export async function readSession(token: string | undefined | null): Promise<StoredSession | null> {
  if (!token || typeof token !== 'string') return null
  // Tokens are base64url; reject anything else before touching the store so a
  // malformed cookie can never be used to probe arbitrary key names.
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null

  const { data } = await redisGet<StoredSession>(sessionKey(token))
  if (!data || typeof data !== 'object') return null
  if (!data.expiresAt || data.expiresAt < Date.now()) {
    await destroySession(token)
    return null
  }
  return data
}

export async function destroySession(token: string | undefined | null): Promise<void> {
  if (!token || typeof token !== 'string') return
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return
  await redisDel(sessionKey(token))
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

// ---------------------------------------------------------------------------
// Request-scoped identity resolution
// ---------------------------------------------------------------------------
//
// SECURITY: this is the ONLY sanctioned way to learn who is calling. It reads
// the server-issued session cookie exclusively. Client-supplied headers such as
// `x-user-email` are deliberately ignored -- trusting them was the original
// tenant-isolation bypass.
//

export async function resolveSession(event: H3Event): Promise<{ session: StoredSession; user: SessionUser } | null> {
  const token = getCookie(event, SESSION_COOKIE)
  const session = await readSession(token)
  if (!session) return null

  // Guest sessions carry no persisted profile; synthesise a stable one from the
  // session's own random id so guests remain isolated from each other.
  if (session.isGuest) {
    return {
      session,
      user: {
        id: session.userId,
        name: 'Guest',
        isGuest: true,
        avatarUrl: '',
        state: 'Relaxed Alertness'
      }
    }
  }

  const { findUserById } = await import('./users')
  const record = await findUserById(session.userId)
  if (!record) {
    // Session references a user that no longer exists -> treat as logged out.
    await destroySession(session.token)
    return null
  }

  return {
    session,
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      isGuest: false,
      avatarUrl: record.avatarUrl,
      state: record.state
    }
  }
}

/**
 * Require a session, or fail with 401. Use in every data-bearing endpoint.
 */
export async function requireSession(event: H3Event) {
  const resolved = await resolveSession(event)
  if (!resolved) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required.'
    })
  }
  return resolved
}

// ---------------------------------------------------------------------------
// Tenant key derivation
// ---------------------------------------------------------------------------
//
// SECURITY: the tenant key is derived from an opaque, server-generated user id
// (uuid-based), never from user-controlled text. This fixes both the header
// impersonation vector and the identifier-collision bug (`a+b@x` vs `a_b@x`).
//

export function getUserRedisKey(userId: string, baseKey: string): string {
  const safe = String(userId || '').replace(/[^A-Za-z0-9_-]/g, '')
  if (!safe) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid tenant identifier.' })
  }
  return `${baseKey}:${safe}`
}

export function newUserId(): string {
  return `user_${randomUUID().replace(/-/g, '')}`
}

export function newGuestId(): string {
  return `guest_${randomUUID().replace(/-/g, '')}`
}

/**
 * Verify a password against a stored record that may be either an scrypt hash
 * (current format) or a legacy plaintext value (pre-remediation).
 *
 * Returns whether the password matched, and whether the caller should rehash --
 * which is the case exactly when a legacy plaintext record matched. Always
 * performs one comparison so callers do not leak account existence via timing.
 */
export async function verifyUserPassword(
  plain: string,
  stored: string | undefined | null
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (isHashedPassword(stored)) {
    return { ok: await verifyPassword(plain, stored), needsRehash: false }
  }
  if (typeof stored === 'string' && stored.length > 0) {
    const ok = safeEqualStrings(stored, plain)
    return { ok, needsRehash: ok }
  }
  // No usable record: burn comparable time, then fail.
  await verifyPassword(plain, 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128))
  return { ok: false, needsRehash: false }
}

/** Length-safe, constant-time string comparison for legacy plaintext records. */
export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}
