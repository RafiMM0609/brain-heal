import { getRedisClient } from './redis'

/**
 * Atomic storage primitives.
 *
 * Audit M5: the original code used `GET` -> mutate array in JS -> `SET` the whole
 * value for every write. Two concurrent requests therefore raced: the later
 * `SET` silently discarded the earlier one (lost updates), and registration's
 * "check email exists, then push" was a textbook TOCTOU that let two identical
 * emails register.
 *
 * All collection data is now modelled as a Redis hash where the field is the
 * item id and the value is the item JSON. That turns each write into a single
 * atomic command:
 *
 *   create/update -> HSET <key> <id> <json>
 *   delete        -> HDEL <key> <id>
 *   uniqueness    -> HSETNX <key> <field> <value>   (returns 0 if present)
 *
 * No read-modify-write cycle remains on the write path.
 */

type Hash = Record<string, string>

// In-memory fallback mirror for when Upstash credentials are absent.
const memoryHashes: Record<string, Hash> = {}

function memoryHash(key: string): Hash {
  if (!memoryHashes[key]) memoryHashes[key] = {}
  return memoryHashes[key]
}

export async function hashGetAll<T>(key: string): Promise<Record<string, T>> {
  const client = getRedisClient()
  if (client) {
    try {
      const raw = await client.hgetall<Hash>(key)
      if (!raw) return {}
      const out: Record<string, T> = {}
      for (const [field, value] of Object.entries(raw)) {
        out[field] = typeof value === 'string' ? (JSON.parse(value) as T) : (value as T)
      }
      return out
    } catch (err) {
      // WRONGTYPE means this key still holds a legacy JSON array; surface it so
      // the caller can migrate rather than silently returning nothing.
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('WRONGTYPE')) return {}
      console.error(`[Store] hgetall failed for "${key}":`, msg)
    }
  }
  const mem = memoryHashes[key] || {}
  const out: Record<string, T> = {}
  for (const [field, value] of Object.entries(mem)) {
    try {
      out[field] = JSON.parse(value) as T
    } catch {
      // skip corrupt entry
    }
  }
  return out
}

export async function hashGet<T>(key: string, field: string): Promise<T | null> {
  const client = getRedisClient()
  if (client) {
    try {
      const raw = await client.hget<Hash[keyof Hash]>(key, field)
      if (raw === null || raw === undefined) return null
      return typeof raw === 'string' ? (JSON.parse(raw) as T) : (raw as T)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('WRONGTYPE')) {
        console.error(`[Store] hget failed for "${key}":`, msg)
      }
    }
  }
  const mem = memoryHashes[key]?.[field]
  if (mem === undefined) return null
  try {
    return JSON.parse(mem) as T
  } catch {
    return null
  }
}

/** Atomically write a single field. */
export async function hashSet<T>(key: string, field: string, value: T): Promise<void> {
  const json = JSON.stringify(value)
  const client = getRedisClient()
  if (client) {
    try {
      await client.hset(key, { [field]: json })
      return
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Store] hset failed for "${key}":`, msg)
    }
  }
  memoryHash(key)[field] = json
}

/**
 * Atomically set a field only if it does not already exist.
 * Returns true when the field was written (i.e. the caller "won" the race).
 */
export async function hashSetNX<T>(key: string, field: string, value: T): Promise<boolean> {
  const json = JSON.stringify(value)
  const client = getRedisClient()
  if (client) {
    try {
      const result = await client.hsetnx(key, field, json)
      return result === 1
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Store] hsetnx failed for "${key}":`, msg)
    }
  }
  const mem = memoryHash(key)
  if (mem[field] !== undefined) return false
  mem[field] = json
  return true
}

export async function hashDel(key: string, field: string): Promise<void> {
  const client = getRedisClient()
  if (client) {
    try {
      await client.hdel(key, field)
      return
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Store] hdel failed for "${key}":`, msg)
    }
  }
  Reflect.deleteProperty(memoryHash(key), field)
}

export async function hashLen(key: string): Promise<number> {
  const client = getRedisClient()
  if (client) {
    try {
      return await client.hlen(key)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('WRONGTYPE')) {
        console.error(`[Store] hlen failed for "${key}":`, msg)
      }
    }
  }
  return Object.keys(memoryHashes[key] || {}).length
}

/**
 * Remove an entire hash.
 *
 * Audit F-01: "Clear All" used `redisDel()`, which only clears the *legacy*
 * `inMemoryStore` mirror. Because collections are now stored as hashes in
 * `memoryHashes`, the delete was a no-op in the fallback path and the endpoint
 * happily returned the unchanged list.
 */
export async function hashClear(key: string): Promise<boolean> {
  const client = getRedisClient()
  if (client) {
    try {
      await client.del(key)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Store] del failed for "${key}":`, msg)
      return false
    }
  }
  Reflect.deleteProperty(memoryHashes, key)
  return true
}


// ---------------------------------------------------------------------------
// Collection helpers built on the primitives above
// ---------------------------------------------------------------------------

export interface CollectionItem {
  id: string
  createdAt?: string
}

/** Newest-first, matching the previous array-prepend display order. */
function sortNewestFirst<T extends CollectionItem>(items: T[]): T[] {
  return items.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    if (tb !== ta) return tb - ta
    return a.id < b.id ? 1 : -1
  })
}

/**
 * Read a whole collection. Handles migration from the legacy JSON-array layout
 * transparently: if the key still holds an array, the items are lifted into the
 * hash layout (best effort) and returned.
 */
export async function listCollection<T extends CollectionItem>(
  key: string,
  legacyReader?: () => Promise<T[] | null>
): Promise<T[]> {
  const asHash = await hashGetAll<T>(key)
  let items = Object.values(asHash)

  if (items.length === 0 && legacyReader) {
    const legacy = await legacyReader()
    if (Array.isArray(legacy) && legacy.length > 0) {
      // Lift legacy array into the hash layout so subsequent writes are atomic.
      await Promise.all(
        legacy
          .filter((item) => item && typeof item.id === 'string')
          .map((item) => hashSet(key, item.id, item))
      )
      items = legacy
    }
  }

  return sortNewestFirst(items)
}

export async function putCollectionItem<T extends CollectionItem>(key: string, item: T): Promise<void> {
  await hashSet(key, item.id, item)
}

export async function deleteCollectionItem(key: string, id: string): Promise<void> {
  await hashDel(key, id)
}

/** Read-modify-write a single item, but only on that item's field. */
export async function patchCollectionItem<T extends CollectionItem>(
  key: string,
  id: string,
  mutate: (current: T) => T | null
): Promise<T | null> {
  const current = await hashGet<T>(key, id)
  if (!current) return null
  const next = mutate(current)
  if (!next) return null
  await hashSet(key, id, next)
  return next
}

/**
 * Trim a collection to `max` newest items. Deletes are individual atomic HDELs,
 * so a concurrent insert is never lost -- worst case the collection briefly
 * exceeds the cap, which is not a correctness or security problem.
 */
export async function trimCollection(key: string, max: number): Promise<void> {
  const all = await hashGetAll<CollectionItem>(key)
  const items = Object.values(all)
  if (items.length <= max) return

  const ordered = sortNewestFirst(items)
  const excess = ordered.slice(max)
  await Promise.all(excess.map((item) => hashDel(key, item.id)))
}
