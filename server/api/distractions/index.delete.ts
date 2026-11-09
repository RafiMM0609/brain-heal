import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisDel } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.DISTRACTIONS)

  await redisDel(key)
  syncBus.emitSync(event, 'distractions', 'delete', user.id)

  return { success: true, distractions: [] }
})
