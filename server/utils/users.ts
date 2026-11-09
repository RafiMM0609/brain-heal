import { REDIS_KEYS, redisGet } from './redis'
import { hashGetAll, hashGet, hashSetNX, hashSet } from './store'

/**
 * User account storage.
 *
 * Audit M5: accounts previously lived in a single JSON array under one key,
 * rewritten wholesale on every registration. The "does this email exist, then
 * push" sequence was a check-then-act race: two concurrent registrations for
 * the same address could both pass the check and the second `SET` would clobber
 * the first.
 *
 * Accounts are now a Redis hash keyed by normalised email, so uniqueness is
 * enforced by the datastore itself via HSETNX -- the loser of a race is told
 * immediately instead of silently overwriting a user.
 */

export interface UserRecord {
  id: string
  name: string
  email: string
  password: string
  avatarUrl: string
  state: 'Relaxed Alertness' | 'Deep Focus' | 'Recharge'
  createdAt: string
}

const USERS_KEY = REDIS_KEYS.USERS

let legacyMigrated = false

/**
 * One-time lift of the legacy `neuralflow:users` JSON array into the hash
 * layout. Safe to call on every request; only does work once.
 */
async function ensureMigrated(): Promise<void> {
  if (legacyMigrated) return
  const { data } = await redisGet<UserRecord[]>(USERS_KEY)
  if (Array.isArray(data) && data.length > 0 && data.every((u) => u && typeof u.email === 'string')) {
    for (const user of data) {
      await hashSet(USERS_KEY, normaliseEmail(user.email), user)
    }
    // Remove the legacy array so the key is a hash from now on.
    const { redisDel } = await import('./redis')
    await redisDel(USERS_KEY)
  }
  legacyMigrated = true
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureMigrated()
  return hashGet<UserRecord>(USERS_KEY, normaliseEmail(email))
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  await ensureMigrated()
  const all = await hashGetAll<UserRecord>(USERS_KEY)
  return Object.values(all).find((u) => u.id === id) ?? null
}

/**
 * Atomically create an account. Returns null when the email is already taken,
 * which is the only safe way to enforce uniqueness under concurrency.
 */
export async function createUser(user: UserRecord): Promise<boolean> {
  await ensureMigrated()
  return hashSetNX(USERS_KEY, normaliseEmail(user.email), user)
}

/** Persist an in-place change (e.g. password rehash). */
export async function updateUser(user: UserRecord): Promise<void> {
  await ensureMigrated()
  await hashSet(USERS_KEY, normaliseEmail(user.email), user)
}
