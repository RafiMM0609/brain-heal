/**
 * Error Handling Helper
 * Type-safe extraction of error messages without resorting to `any`
 */

export function getErrorMessage(err: unknown, defaultMessage = 'Terjadi kesalahan sistem.'): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  if (err && typeof err === 'object') {
    const errorObj = err as Record<string, unknown>
    if (typeof errorObj.statusMessage === 'string') {
      return errorObj.statusMessage
    }
    if (typeof errorObj.message === 'string') {
      return errorObj.message
    }
  }
  return defaultMessage
}
