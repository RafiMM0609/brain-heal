import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { ShareItem } from './index.get'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    type: 'text' | 'image'
    content: string
    fileName?: string
    fileSizeFormatted?: string
  }>(event)

  if (!body || !body.content || !body.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payload: content and type are required'
    })
  }

  const { data: existingItems } = await redisGet<ShareItem[]>(REDIS_KEYS.SHARE)
  const currentItems = Array.isArray(existingItems) ? existingItems : []

  const newItem: ShareItem = {
    id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: body.type,
    content: body.content,
    fileName: body.fileName,
    fileSizeFormatted: body.fileSizeFormatted,
    createdAt: new Date().toISOString()
  }

  // Prepend new item and keep up to 50 items
  const updatedItems = [newItem, ...currentItems].slice(0, 50)
  await redisSet(REDIS_KEYS.SHARE, updatedItems)

  syncBus.emitSync('share', 'create')

  return {
    success: true,
    item: newItem
  }
})
