import { defineStore } from 'pinia'
import type { ShareItem } from '~/server/api/share/index.get'

export async function compressImageFile(
  file: File,
  maxDimension = 1600,
  maxSizeBytes = 850 * 1024 // ~850KB target to be safely under 1MB limit
): Promise<{ dataUrl: string; formattedSize: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Downscale image if dimensions exceed maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'))
          return
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        let quality = 0.85
        let dataUrl = canvas.toDataURL('image/jpeg', quality)

        // Iteratively reduce quality / scale if size exceeds limit
        let attempts = 0
        while (dataUrl.length * 0.75 > maxSizeBytes && attempts < 6) {
          quality -= 0.15
          if (quality < 0.25) {
            // Also reduce canvas resolution if quality is very low
            canvas.width = Math.round(canvas.width * 0.8)
            canvas.height = Math.round(canvas.height * 0.8)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            quality = 0.75
          }
          dataUrl = canvas.toDataURL('image/jpeg', Math.max(0.2, quality))
          attempts++
        }

        const sizeInBytes = Math.round(dataUrl.length * 0.75)
        const formattedSize =
          sizeInBytes > 1024 * 1024
            ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(sizeInBytes / 1024)} KB`

        resolve({ dataUrl, formattedSize })
      }

      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const useShareStore = defineStore('share', () => {
  const { apiFetch } = useApi()
  const items = ref<ShareItem[]>([])
  const isLoading = ref(false)
  const isUploading = ref(false)
  const uploadStatus = ref<string | null>(null)

  async function fetchItems() {
    isLoading.value = true
    try {
      const response = await apiFetch<{ items: ShareItem[] }>('/api/share')
      items.value = response.items || []
    } catch (err) {
      console.error('[ShareStore] Failed to fetch shared items:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addTextItem(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    isUploading.value = true
    uploadStatus.value = 'Sharing text...'
    try {
      const res = await apiFetch<{ success: boolean; item: ShareItem }>('/api/share', {
        method: 'POST',
        body: {
          type: 'text',
          content: trimmed
        }
      })
      if (res.item) {
        items.value = [res.item, ...items.value.filter((i) => i.id !== res.item.id)]
      }
    } catch (err) {
      console.error('[ShareStore] Error sharing text:', err)
      throw err
    } finally {
      isUploading.value = false
      uploadStatus.value = null
    }
  }

  async function addImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not an image')
    }

    isUploading.value = true
    uploadStatus.value = 'Compressing image under 1MB...'
    try {
      const { dataUrl, formattedSize } = await compressImageFile(file)
      uploadStatus.value = `Uploading compressed image (${formattedSize})...`

      const res = await apiFetch<{ success: boolean; item: ShareItem }>('/api/share', {
        method: 'POST',
        body: {
          type: 'image',
          content: dataUrl,
          fileName: file.name,
          fileSizeFormatted: formattedSize
        }
      })

      if (res.item) {
        items.value = [res.item, ...items.value.filter((i) => i.id !== res.item.id)]
      }
    } catch (err) {
      console.error('[ShareStore] Error compressing/uploading image:', err)
      throw err
    } finally {
      isUploading.value = false
      uploadStatus.value = null
    }
  }

  async function deleteItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    try {
      await apiFetch('/api/share', {
        method: 'DELETE',
        query: { id }
      })
    } catch (err) {
      console.error('[ShareStore] Error deleting item:', err)
      fetchItems()
    }
  }

  async function clearAll() {
    items.value = []
    try {
      await apiFetch('/api/share', {
        method: 'DELETE',
        query: { clear: 'true' }
      })
    } catch (err) {
      console.error('[ShareStore] Error clearing items:', err)
      fetchItems()
    }
  }

  return {
    items,
    isLoading,
    isUploading,
    uploadStatus,
    fetchItems,
    addTextItem,
    addImageFile,
    deleteItem,
    clearAll
  }
})
