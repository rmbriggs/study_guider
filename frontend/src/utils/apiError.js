/**
 * Normalizes FastAPI/axios error response into a single user-facing string.
 * - detail is string: use as-is
 * - detail is array (422 validation): map to msg and join
 * - no response (e.g. network): use fallback
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const detail = err?.response?.data?.detail
  if (detail == null) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg ?? String(item))
    return messages.filter(Boolean).join('; ') || fallback
  }
  return fallback
}
