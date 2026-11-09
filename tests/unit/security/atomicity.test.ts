import { describe, it, expect, beforeEach, vi } from 'vitest'

// Force the in-memory fallback path so tests are hermetic.
vi.mock('~/server/utils/redis', () => ({
  getRedisClient: () => null,
  REDIS_KEYS: {
    TASKS: 'neuralflow:tasks',
    USERS: 'neuralflow:users',
    PUSH_SUBS: 'neuralflow:push_subscriptions'
  },
  redisGet: async () => ({ data: null, isFallback: true }),
  redisSet: async () => ({ success: true, isFallback: true }),
  redisDel: async () => ({ success: true, isFallback: true })
}))

const store = await import('~/server/utils/store')

describe('atomic collection primitives (audit M5)', () => {
  let key: string
  let n = 0

  beforeEach(() => {
    key = `test:collection:${++n}`
  })

  it('keeps every item when creates interleave', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: `item-${i}`,
      title: `Task ${i}`,
      createdAt: new Date(Date.now() + i).toISOString()
    }))

    // Fire all writes without awaiting between them: this is the interleaving
    // that the old GET->mutate->SET pattern lost items under.
    await Promise.all(items.map((item) => store.putCollectionItem(key, item)))

    const read = await store.listCollection<{ id: string; title: string }>(key)
    expect(read).toHaveLength(25)
    expect(new Set(read.map((t) => t.id)).size).toBe(25)
  })

  it('returns items newest-first, matching the previous UI order', async () => {
    await store.putCollectionItem(key, { id: 'older', createdAt: '2020-01-01T00:00:00.000Z' })
    await store.putCollectionItem(key, { id: 'newer', createdAt: '2024-01-01T00:00:00.000Z' })

    const read = await store.listCollection<{ id: string }>(key)
    expect(read.map((t) => t.id)).toEqual(['newer', 'older'])
  })

  it('applies a patch to exactly one item and leaves others intact', async () => {
    await store.putCollectionItem(key, { id: 'a', title: 'A', createdAt: '2024-01-01T00:00:00.000Z' })
    await store.putCollectionItem(key, { id: 'b', title: 'B', createdAt: '2024-01-02T00:00:00.000Z' })

    const updated = await store.patchCollectionItem<{ id: string; title: string; done?: boolean }>(
      key,
      'a',
      (current) => ({ ...current, title: 'A-edited', done: true })
    )

    expect(updated).toMatchObject({ id: 'a', title: 'A-edited', done: true })

    const read = await store.listCollection<{ id: string; title: string }>(key)
    expect(read.find((t) => t.id === 'a')?.title).toBe('A-edited')
    expect(read.find((t) => t.id === 'b')?.title).toBe('B')
  })

  it('returns null when patching a missing item', async () => {
    const result = await store.patchCollectionItem(key, 'nope', (c) => c)
    expect(result).toBeNull()
  })

  it('deletes one item without rewriting the rest', async () => {
    await store.putCollectionItem(key, { id: 'keep', createdAt: '2024-01-01T00:00:00.000Z' })
    await store.putCollectionItem(key, { id: 'drop', createdAt: '2024-01-02T00:00:00.000Z' })

    await store.deleteCollectionItem(key, 'drop')

    const read = await store.listCollection<{ id: string }>(key)
    expect(read.map((t) => t.id)).toEqual(['keep'])
  })

  it('trims a collection to the newest N without losing concurrent inserts', async () => {
    for (let i = 0; i < 12; i++) {
      await store.putCollectionItem(key, {
        id: `item-${i}`,
        createdAt: new Date(2024, 0, 1, 0, 0, i).toISOString()
      })
    }

    await store.trimCollection(key, 5)

    const read = await store.listCollection<{ id: string }>(key)
    expect(read).toHaveLength(5)
    // The five newest survive.
    expect(read.map((t) => t.id)).toEqual(['item-11', 'item-10', 'item-9', 'item-8', 'item-7'])
  })
})

describe('atomic user creation (audit M5 — registration TOCTOU)', () => {
  it('lets exactly one concurrent registration win for the same email', async () => {
    const users = await import('~/server/utils/users')
    const email = `race-${Date.now()}@example.com`

    const makeUser = (suffix: string) => ({
      id: `user_${suffix}`,
      name: `Racer ${suffix}`,
      email,
      password: 'scrypt$00$00',
      avatarUrl: '',
      state: 'Relaxed Alertness' as const,
      createdAt: new Date().toISOString()
    })

    // Ten simultaneous registrations for one address.
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => users.createUser(makeUser(`race${i}`)))
    )

    const winners = results.filter(Boolean)
    expect(winners).toHaveLength(1)

    const stored = await users.findUserByEmail(email)
    expect(stored).not.toBeNull()
    expect(stored?.email).toBe(email)
  })

  it('normalises email case so casing cannot create duplicate accounts', async () => {
    const users = await import('~/server/utils/users')
    const base = `CaseTest-${Date.now()}@Example.COM`

    const first = await users.createUser({
      id: 'user_case1',
      name: 'Case',
      email: users.normaliseEmail(base),
      password: 'scrypt$00$00',
      avatarUrl: '',
      state: 'Relaxed Alertness',
      createdAt: new Date().toISOString()
    })
    expect(first).toBe(true)

    const second = await users.createUser({
      id: 'user_case2',
      name: 'Case Two',
      email: users.normaliseEmail(base.toUpperCase()),
      password: 'scrypt$00$00',
      avatarUrl: '',
      state: 'Relaxed Alertness',
      createdAt: new Date().toISOString()
    })
    expect(second).toBe(false)
  })
})
