import webPush from 'web-push'

interface VapidKeys {
  publicKey: string
  privateKey: string
}

let cachedVapidKeys: VapidKeys | null = null

export function getVapidKeys(): VapidKeys {
  if (cachedVapidKeys) return cachedVapidKeys

  const config = useRuntimeConfig()
  const envPublic = process.env.VAPID_PUBLIC_KEY || (config as any).vapidPublicKey
  const envPrivate = process.env.VAPID_PRIVATE_KEY || (config as any).vapidPrivateKey

  if (envPublic && envPrivate) {
    cachedVapidKeys = {
      publicKey: envPublic,
      privateKey: envPrivate
    }
  } else {
    // Generate deterministic or fallback VAPID keys for zero-config operation
    // Stable fallback key pair for development/preview mode
    cachedVapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Skv69yViEuiBIa-Ib9-Skv69yViEuiBIa-Ib9',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'AEl62iUYgUivxIkv69yViEuiBIa-Ib9-Skv69yViEuiBIa'
    }

    try {
      const generated = webPush.generateVAPIDKeys()
      cachedVapidKeys = generated
    } catch (e) {
      console.warn('[VAPID] Web-push VAPID generation fallback:', e)
    }
  }

  try {
    webPush.setVapidDetails(
      'mailto:admin@neuralflow.app',
      cachedVapidKeys.publicKey,
      cachedVapidKeys.privateKey
    )
  } catch (err) {
    console.warn('[VAPID] Failed to set VAPID details:', err)
  }

  return cachedVapidKeys
}
