import axios from 'axios'

// Use VITE_API_URL when set (e.g. when not using Vite proxy); otherwise rely on proxy to backend
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (HttpOnly auth cookie) with every request
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}
