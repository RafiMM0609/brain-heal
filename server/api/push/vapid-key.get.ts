import { getVapidKeys } from '~/server/utils/vapid'

export default defineEventHandler(() => {
  const keys = getVapidKeys()
  return {
    publicKey: keys.publicKey
  }
})
