export default defineNuxtPlugin(() => {
  // Applied on the client before first paint of interactive UI. The `.dark`
  // class lives on <html>, so no hydration mismatch is produced: markup is
  // identical, only CSS variables change.
  useColorMode().init()
})
