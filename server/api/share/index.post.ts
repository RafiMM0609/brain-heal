import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { putCollectionItem, trimCollection } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { ShareItem } from './index.get'

const MAX_ITEMS = 50
const MAX_TEXT_LENGTH = 20000
const MAX_IMAGE_DATA_URL_LENGTH = 1_400_000
const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.SHARE)
  const body = await readBody<{
    type?: 'text' | 'image'
    content?: string
    fileName?: string
    fileSizeFormatted?: string
  }>(event)

  if (!body || typeof body.content !== 'string' || (body.type !== 'text' && body.type !== 'image')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payload: content and type are required'
    })
  }

  // Audit M2: image content must be a base64 image data URL -- never an
  // arbitrary URL, which would otherwise flow into <img src>, fetch() and
  // <a href> sinks on every viewing client.
  if (body.type === 'image') {
    if (body.content.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw createError({ statusCode: 413, statusMessage: 'Image is too large.' })
    }
    if (!IMAGE_DATA_URL_RE.test(body.content)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid image data.' })
    }
  } else {
    if (!body.content.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Content cannot be empty.' })
    }
    if (body.content.length > MAX_TEXT_LENGTH) {
      throw createError({ statusCode: 413, statusMessage: 'Text is too long.' })
    }
  }

  const newItem: ShareItem = {
    id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    type: body.type,
    content: body.content,
    fileName: typeof body.fileName === 'string' ? body.fileName.slice(0, 255) : undefined,
    fileSizeFormatted: typeof body.fileSizeFormatted === 'string' ? body.fileSizeFormatted.slice(0, 32) : undefined,
    createdAt: new Date().toISOString()
  }

  // Audit M5: insert is one HSET; trimming removes only excess fields via HDEL,
  // so a concurrent insert is never dropped.
  await putCollectionItem(key, newItem)
  await trimCollection(key, MAX_ITEMS)

  syncBus.emitSync(event, 'share', 'create', user.id)

  return { success: true, item: newItem }
})
