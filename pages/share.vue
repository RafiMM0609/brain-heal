<script setup lang="ts">
import { useShareStore } from '~/stores/useShareStore'
import type { ShareItem } from '~/server/api/share/index.get'

const shareStore = useShareStore()
const textInput = ref('')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const toastMessage = ref<string | null>(null)
const selectedPreviewImage = ref<string | null>(null)
const copiedItemId = ref<string | null>(null)

onMounted(() => {
  shareStore.fetchItems()
  window.addEventListener('paste', handleGlobalPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', handleGlobalPaste)
})

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = null
    }
  }, 3000)
}

function handleGlobalPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        handleImageUpload(file)
        return
      }
    }
  }

  // If active element is not an input/textarea and text is pasted
  const target = e.target as HTMLElement
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
    const pastedText = e.clipboardData?.getData('text')
    if (pastedText && pastedText.trim()) {
      e.preventDefault()
      textInput.value = pastedText
      submitText()
    }
  }
}

async function submitText() {
  if (!textInput.value.trim() || shareStore.isUploading) return
  const val = textInput.value
  textInput.value = ''
  try {
    await shareStore.addTextItem(val)
    showToast('Teks berhasil dibagikan!')
  } catch (err) {
    showToast('Gagal membagikan teks.')
    textInput.value = val
  }
}

async function handleImageUpload(file: File) {
  if (shareStore.isUploading) return
  try {
    await shareStore.addImageFile(file)
    showToast('Gambar berhasil dikompres & dibagikan!')
  } catch (err: any) {
    showToast(err?.message || 'Gagal membagikan gambar.')
  }
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    handleImageUpload(input.files[0])
    input.value = ''
  }
}

function onDropFile(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    handleImageUpload(e.dataTransfer.files[0])
  }
}

async function copyTextToClipboard(item: ShareItem) {
  try {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(item.content)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = item.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copiedItemId.value = item.id
    showToast('Teks disalin ke clipboard!')
    setTimeout(() => {
      if (copiedItemId.value === item.id) copiedItemId.value = null
    }, 2000)
  } catch (err) {
    showToast('Gagal menyalin teks.')
  }
}

async function copyImageToClipboard(item: ShareItem) {
  try {
    copiedItemId.value = item.id
    const res = await fetch(item.content)
    const blob = await res.blob()

    let pngBlob = blob
    if (blob.type !== 'image/png') {
      const img = new Image()
      img.src = item.content
      await new Promise((resolve) => (img.onload = resolve))
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      pngBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b || blob), 'image/png')
      )
    }

    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null
    if (nav?.clipboard && typeof nav.clipboard.write === 'function') {
      await nav.clipboard.write([
        new ClipboardItem({
          [pngBlob.type]: pngBlob
        })
      ])
      showToast('Gambar disalin ke clipboard! Tinggal paste.')
    } else if (nav?.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(item.content)
      showToast('Base64 disalin ke clipboard!')
    } else {
      showToast('Clipboard API tidak didukung di browser ini.')
    }
  } catch (err) {
    console.error('Error copying image:', err)
    try {
      await (navigator as any).clipboard?.writeText(item.content)
      showToast('Base64 gambar disalin ke clipboard!')
    } catch {
      showToast('Gagal menyalin gambar.')
    }
  } finally {
    setTimeout(() => {
      if (copiedItemId.value === item.id) copiedItemId.value = null
    }, 2000)
  }
}

function downloadImage(item: ShareItem) {
  const link = document.createElement('a')
  link.href = item.content
  link.download = item.fileName || `shared-image-${Date.now()}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('Gambar di-download!')
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 30) return 'Baru saja'
  if (seconds < 60) return `${seconds} dtk yang lalu`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} bln/mnt yang lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam yang lalu`
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header Title Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant pb-4">
      <div>
        <div class="flex items-center gap-2 text-primary font-bold text-xl sm:text-2xl">
          <Icon name="material-symbols:content-paste-go" class="text-[28px] text-primary" />
          <h1>Cross-Device Clipboard & Media Share</h1>
        </div>
        <p class="text-xs sm:text-sm text-on-surface-variant mt-1">
          Bagi teks & screenshot antar HP dan laptop secara real-time. Gambar otomatis dikompres &lt; 1MB.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="shareStore.items.length > 0"
          @click="shareStore.clearAll()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors border border-error/20"
        >
          <Icon name="material-symbols:delete-sweep-outline" class="text-[18px]" />
          <span>Hapus Semua</span>
        </button>
        <button
          @click="shareStore.fetchItems()"
          :disabled="shareStore.isLoading"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors border border-outline-variant"
        >
          <Icon
            name="material-symbols:refresh"
            class="text-[18px]"
            :class="{ 'animate-spin': shareStore.isLoading }"
          />
          <span>Sync</span>
        </button>
      </div>
    </div>

    <!-- Upload & Input Controls -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Text Share Input Card -->
      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex flex-col justify-between shadow-sm">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <Icon name="material-symbols:short-text" class="text-primary text-[20px]" />
              <span>Bagikan Teks / Link</span>
            </label>
            <span class="text-[11px] text-on-surface-variant">atau langsung Ctrl+V</span>
          </div>
          <textarea
            v-model="textInput"
            rows="4"
            placeholder="Ketik atau tempel teks, nomor HP, link, atau catatan di sini..."
            class="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            @keydown.enter.ctrl.exact.prevent="submitText"
            @keydown.enter.meta.exact.prevent="submitText"
          ></textarea>
        </div>
        <div class="flex justify-between items-center mt-3 pt-2 border-t border-outline-variant/50">
          <span class="text-[11px] text-on-surface-variant">Tekan Ctrl+Enter untuk kirim</span>
          <button
            @click="submitText"
            :disabled="!textInput.trim() || shareStore.isUploading"
            class="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="material-symbols:send" class="text-[16px]" />
            <span>Kirim Teks</span>
          </button>
        </div>
      </div>

      <!-- Drag & Drop Image Upload Card -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDropFile"
        class="border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[190px] relative overflow-hidden"
        :class="
          isDragging
            ? 'border-primary bg-primary/10 scale-[0.99]'
            : 'border-outline-variant bg-surface-container-low hover:border-primary/50'
        "
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileSelected"
        />

        <div class="w-12 h-12 rounded-full bg-primary-container/40 text-primary flex items-center justify-center mb-2 shadow-inner">
          <Icon name="material-symbols:add-photo-alternate" class="text-[28px]" />
        </div>

        <p class="text-sm font-semibold text-on-surface">
          Upload Screenshot / Gambar
        </p>
        <p class="text-xs text-on-surface-variant mt-1 max-w-[240px]">
          Drag & drop gambar di sini, atau paste langsung (<kbd class="px-1.5 py-0.5 bg-surface border border-outline-variant rounded text-[10px]">Ctrl+V</kbd>)
        </p>

        <button
          @click="fileInput?.click()"
          :disabled="shareStore.isUploading"
          class="mt-3 px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Icon name="material-symbols:upload-file" class="text-[16px]" />
          <span>Pilih Gambar</span>
        </button>

        <div class="mt-2 text-[10px] text-primary/80 font-medium flex items-center gap-1">
          <Icon name="material-symbols:bolt" class="text-[14px]" />
          <span>Otomatis kompres &lt; 1MB</span>
        </div>
      </div>
    </div>

    <!-- Upload Status Progress Bar -->
    <div
      v-if="shareStore.isUploading"
      class="bg-primary-container/20 border border-primary/30 rounded-xl p-3 flex items-center gap-3 animate-pulse"
    >
      <Icon name="material-symbols:sync" class="animate-spin text-primary text-[24px]" />
      <span class="text-xs font-semibold text-primary">
        {{ shareStore.uploadStatus || 'Memproses & mengunggah media...' }}
      </span>
    </div>

    <!-- Share Feed Section -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="material-symbols:history" class="text-primary text-[20px]" />
          <span>Riwayat Media Shared ({{ shareStore.items.length }})</span>
        </h2>
        <span class="text-[11px] text-on-surface-variant">Tersinkronisasi Realtime</span>
      </div>

      <!-- Empty State -->
      <div
        v-if="!shareStore.isLoading && shareStore.items.length === 0"
        class="bg-surface-container-low border border-outline-variant rounded-2xl p-8 text-center"
      >
        <div class="w-12 h-12 mx-auto rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center mb-3">
          <Icon name="material-symbols:share-off" class="text-[28px]" />
        </div>
        <p class="text-sm font-semibold text-on-surface">Belum ada media yang dibagikan</p>
        <p class="text-xs text-on-surface-variant mt-1">
          Tempel teks atau upload gambar dari HP/laptop untuk mulai berbagi.
        </p>
      </div>

      <!-- Items Grid / List -->
      <div class="space-y-3">
        <div
          v-for="item in shareStore.items"
          :key="item.id"
          class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 transition-all hover:border-primary/40 shadow-xs relative group"
        >
          <!-- Item Card Header -->
          <div class="flex items-center justify-between mb-3 border-b border-outline-variant/40 pb-2">
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide flex items-center gap-1"
                :class="
                  item.type === 'image'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-primary-container text-on-primary-container'
                "
              >
                <Icon
                  :name="item.type === 'image' ? 'material-symbols:image' : 'material-symbols:notes'"
                  class="text-[14px]"
                />
                {{ item.type === 'image' ? 'Gambar' : 'Teks' }}
              </span>

              <span v-if="item.fileSizeFormatted" class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {{ item.fileSizeFormatted }}
              </span>

              <span class="text-[11px] text-on-surface-variant">
                {{ formatTimeAgo(item.createdAt) }}
              </span>
            </div>

            <button
              @click="shareStore.deleteItem(item.id)"
              class="text-on-surface-variant hover:text-error p-1 rounded-lg hover:bg-error/10 transition-colors"
              title="Hapus"
            >
              <Icon name="material-symbols:delete" class="text-[18px]" />
            </button>
          </div>

          <!-- Text Content -->
          <div v-if="item.type === 'text'" class="space-y-3">
            <div class="bg-surface border border-outline-variant/60 rounded-xl p-3.5 text-sm font-mono text-on-surface whitespace-pre-wrap break-words max-h-60 overflow-y-auto select-text">
              {{ item.content }}
            </div>
            <div class="flex justify-end">
              <button
                @click="copyTextToClipboard(item)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                :class="
                  copiedItemId === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                "
              >
                <Icon
                  :name="copiedItemId === item.id ? 'material-symbols:check' : 'material-symbols:content-copy'"
                  class="text-[16px]"
                />
                <span>{{ copiedItemId === item.id ? 'Tersalin!' : 'Copy Teks' }}</span>
              </button>
            </div>
          </div>

          <!-- Image Content -->
          <div v-else-if="item.type === 'image'" class="space-y-3">
            <div
              class="relative rounded-xl overflow-hidden bg-black/40 border border-outline-variant max-h-80 flex items-center justify-center cursor-pointer group/img"
              @click="selectedPreviewImage = item.content"
            >
              <img
                :src="item.content"
                :alt="item.fileName || 'Shared Image'"
                class="max-h-80 w-auto object-contain transition-transform duration-300 group-hover/img:scale-105"
              />
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <span class="bg-surface/80 backdrop-blur-md text-on-surface px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Icon name="material-symbols:zoom-in" class="text-[16px]" />
                  Perbesar
                </span>
              </div>
            </div>

            <!-- Image Actions -->
            <div class="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span class="text-[11px] text-on-surface-variant truncate max-w-[200px]">
                {{ item.fileName || 'screenshot.jpg' }}
              </span>

              <div class="flex items-center gap-2">
                <button
                  @click="downloadImage(item)"
                  class="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  title="Download File"
                >
                  <Icon name="material-symbols:download" class="text-[16px]" />
                  <span>Download</span>
                </button>

                <button
                  @click="copyImageToClipboard(item)"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  :class="
                    copiedItemId === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary text-on-primary hover:bg-primary-container'
                  "
                  title="Salin gambar langsung ke clipboard"
                >
                  <Icon
                    :name="copiedItemId === item.id ? 'material-symbols:check' : 'material-symbols:content-paste'"
                    class="text-[16px]"
                  />
                  <span>{{ copiedItemId === item.id ? 'Tersalin ke Clipboard!' : 'Copy Gambar' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div
      v-if="selectedPreviewImage"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      @click.self="selectedPreviewImage = null"
    >
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          @click="selectedPreviewImage = null"
          class="absolute -top-10 right-0 text-white hover:text-error bg-surface/30 p-1.5 rounded-full backdrop-blur-sm transition-colors"
        >
          <Icon name="material-symbols:close" class="text-[24px]" />
        </button>
        <img
          :src="selectedPreviewImage"
          alt="Enlarged Preview"
          class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />
      </div>
    </div>

    <!-- Toast Floating Alert -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-surface-bright font-semibold text-xs sm:text-sm"
      >
        <Icon name="material-symbols:check-circle" class="text-[20px]" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>
