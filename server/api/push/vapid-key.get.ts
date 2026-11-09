import { getVapidKeys } from '~/server/utils/vapid'

export default defineEventHandler(() => {
  const keys = getVapidKeys()
  // Only the public half is ever returned.
  return { publicKey: keys.publicKey }
})
