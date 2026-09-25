/**
 * Clipboard & Media Helpers
 * Centralized utility for cross-browser clipboard operations and media downloads
 * with robust fallbacks for non-secure contexts and legacy browsers.
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for non-secure contexts or unsupported Clipboard API
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.setAttribute('readonly', '')
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      textArea.remove()
      return successful
    }
    return false
  } catch (err) {
    console.warn('[Clipboard] Failed to copy text:', err)
    return false
  }
}

export interface CopyImageResult {
  success: boolean
  mode: 'blob' | 'base64' | 'none'
  error?: unknown
}

export async function copyImageToClipboard(contentUrl: string): Promise<CopyImageResult> {
  try {
    const res = await fetch(contentUrl)
    const blob = await res.blob()

    let pngBlob = blob
    if (blob.type !== 'image/png') {
      const img = new Image()
      img.src = contentUrl
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true)
        img.onerror = reject
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      pngBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b || blob), 'image/png')
      )
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
      await navigator.clipboard.write([
        new ClipboardItem({
          [pngBlob.type]: pngBlob
        })
      ])
      return { success: true, mode: 'blob' }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(contentUrl)
      return { success: true, mode: 'base64' }
    } else {
      const fallbackSuccess = await copyTextToClipboard(contentUrl)
      return { success: fallbackSuccess, mode: fallbackSuccess ? 'base64' : 'none' }
    }
  } catch (err) {
    console.warn('[Clipboard] Failed to copy image blob, attempting text fallback:', err)
    try {
      const fallbackSuccess = await copyTextToClipboard(contentUrl)
      return { success: fallbackSuccess, mode: fallbackSuccess ? 'base64' : 'none' }
    } catch {
      return { success: false, mode: 'none', error: err }
    }
  }
}

export function downloadMedia(url: string, filename: string): void {
  if (typeof document === 'undefined') return
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `download-${Date.now()}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
