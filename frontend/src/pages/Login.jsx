import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message

  useEffect(() => {
    if (successMessage) window.history.replaceState({}, '', location.pathname)
  }, [successMessage, location.pathname])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      login(data.user)
      navigate('/')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Make sure the backend is running (port 8000). See README for how to start it.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="auth-page-brand">
        <img src="/logo.png" alt="CourseMind" />
        <span>CourseMind</span>
      </Link>
      <div className="auth-page-card">
        <h1 className="section-title">Log in</h1>
        <p className="section-subtitle">Welcome back to CourseMind.</p>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ marginBottom: 16 }}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ marginBottom: 24 }}
          />
          {successMessage && <div style={{ marginBottom: 16, color: 'var(--color-success)', fontSize: 14 }}>{successMessage}</div>}
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--blue-bold)' }}>Forgot password?</Link>
        </p>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--blue-bold)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
