export default defineNuxtRouteMiddleware(async (to) => {
  // Guest sessions are valid here: they are real (server-minted) tenants.
  // Only redirect when there is no session at all, so the app shells never
  // render with an empty/failed fetch behind them (Audit F-03).
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(to.path)) return

  const authStore = useAuthStore()

  if (!authStore.isResolved) {
    await authStore.loadUserFromStorage()
  }

  if (!authStore.user) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
