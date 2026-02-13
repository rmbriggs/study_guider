import { createContext, useContext, useState, useEffect } from 'react'
import { getStoredToken, setAuthToken, logout as apiLogout } from '../api/auth'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      setAuthToken(token)
      api.get('/auth/me').then(({ data }) => {
        setUser(data) // { id, email }
      }).catch(() => {
        apiLogout()
        setUser(null)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (userData) => setUser(userData?.user ?? userData)
  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
