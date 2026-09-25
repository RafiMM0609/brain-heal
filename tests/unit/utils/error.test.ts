import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '~/utils/error'

describe('utils/error -> getErrorMessage', () => {
  it('extracts message from standard Error instance', () => {
    const error = new Error('Database connection failed')
    expect(getErrorMessage(error)).toBe('Database connection failed')
  })

  it('returns raw string when error is a string', () => {
    expect(getErrorMessage('Token expired')).toBe('Token expired')
  })

  it('extracts statusMessage from H3 / Nuxt error object', () => {
    const h3Error = {
      statusCode: 400,
      statusMessage: 'Invalid credentials provided'
    }
    expect(getErrorMessage(h3Error)).toBe('Invalid credentials provided')
  })

  it('extracts message property from generic error object', () => {
    const customError = {
      message: 'Network request timed out',
      code: 'TIMEOUT'
    }
    expect(getErrorMessage(customError)).toBe('Network request timed out')
  })

  it('returns default fallback message when error is unknown or empty', () => {
    expect(getErrorMessage(null)).toBe('Terjadi kesalahan sistem.')
    expect(getErrorMessage(undefined)).toBe('Terjadi kesalahan sistem.')
    expect(getErrorMessage(12345)).toBe('Terjadi kesalahan sistem.')
    expect(getErrorMessage({})).toBe('Terjadi kesalahan sistem.')
    expect(getErrorMessage(null, 'Custom default error')).toBe('Custom default error')
  })
})
