import { api, setAuthToken } from './client'

const STORAGE_KEY = 'study_guider_token'

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  const token = data.access_token
  localStorage.setItem(STORAGE_KEY, token)
  setAuthToken(token)
  return data
}

export async function register(email, password) {
  const { data } = await api.post('/auth/register', { email, password })
  const token = data.access_token
  localStorage.setItem(STORAGE_KEY, token)
  setAuthToken(token)
  return data
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
  setAuthToken(null)
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEY)
}
