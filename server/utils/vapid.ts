import webPush from 'web-push'

interface VapidKeys {
  publicKey: string
  privateKey: string
}

let cachedVapidKeys: VapidKeys | null = null

/**
 * Resolves VAPID keys from configuration.
 *
 * Audit fix: the previous implementation embedded a hardcoded fallback key pair
 * in source and silently generated a new pair per process when config was
 * absent -- which makes push subscriptions non-deterministic across restarts
 * and ships a known private key. Now keys come from config only; when they are
 * missing we generate an ephemeral pair for local development and warn loudly.
 */
export function getVapidKeys(): VapidKeys {
  if (cachedVapidKeys) return cachedVapidKeys

  const envPublic = process.env.VAPID_PUBLIC_KEY || ''
  const envPrivate = process.env.VAPID_PRIVATE_KEY || ''
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

  if (envPublic && envPrivate) {
    cachedVapidKeys = { publicKey: envPublic, privateKey: envPrivate }
  } else {
    console.warn(
      '[VAPID] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not configured. ' +
        'Generating an ephemeral key pair -- push subscriptions will not survive a restart. ' +
        'Set both keys in production.'
    )
    const generated = webPush.generateVAPIDKeys()
    cachedVapidKeys = { publicKey: generated.publicKey, privateKey: generated.privateKey }
  }

  try {
    webPush.setVapidDetails(subject, cachedVapidKeys.publicKey, cachedVapidKeys.privateKey)
  } catch (err) {
    console.warn('[VAPID] Failed to set VAPID details:', err)
  }

  return cachedVapidKeys
}
