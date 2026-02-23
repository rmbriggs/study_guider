import { api, setAuthToken } from './client'

export { setAuthToken }

// Auth uses HttpOnly cookies; we do not store the token in localStorage.

export async function login(email, password, staySignedIn = true) {
  const { data } = await api.post('/auth/login', { email, password, stay_signed_in: staySignedIn })
  return data
}

export async function register(email, password, username, staySignedIn = true) {
  const { data } = await api.post('/auth/register', { email, password, username, stay_signed_in: staySignedIn })
  return data
}

/** Update the current user's username. Returns updated user. */
export async function updateUsername(username) {
  const { data } = await api.patch('/auth/me', { username })
  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    setAuthToken(null)
  }
}

/** Not used when auth is cookie-based; kept for compatibility. */
export function getStoredToken() {
  return null
}

/** Verify email by 6-digit code or link token. body: { code: '123456' } or { token: '...' } */
export async function verifyEmail(body) {
  if (body.token) {
    const { data } = await api.get('/auth/verify-email', { params: { token: body.token } })
    return data
  }
  const { data } = await api.post('/auth/verify-email', { code: body.code, token: null })
  return data
}

export async function resendVerificationEmail() {
  const { data } = await api.post('/auth/resend-verification')
  return data
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token, newPassword) {
  const { data } = await api.post('/auth/reset-password', { token, new_password: newPassword })
  return data
}

/** Permanently delete the current user's account. Caller should clear auth state (e.g. logout) and redirect. */
export async function deleteAccount() {
  await api.delete('/auth/me')
}
