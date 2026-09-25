export interface ShareItem {
  id: string
  type: 'text' | 'image'
  content: string
  fileName?: string
  fileSizeFormatted?: string
  createdAt: string
}
