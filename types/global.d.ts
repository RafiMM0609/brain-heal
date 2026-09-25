export {}

declare global {
  interface DocumentPictureInPicture {
    requestWindow(options?: { width?: number; height?: number }): Promise<Window>
  }

  interface Window {
    __NUXT_CLIENT_ID__?: string
    documentPictureInPicture?: DocumentPictureInPicture
    webkitAudioContext?: typeof AudioContext
  }
}
