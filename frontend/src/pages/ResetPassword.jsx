import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ResetPassword() {
  const { token: tokenFromPath } = useParams()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get('token')
  const token = tokenFromPath || tokenFromQuery
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) setError('Missing reset link. Request a new password reset.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 1) {
      setError('Enter a new password')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login', { state: { message: 'Password updated. You can log in now.' } }), 2000)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <Link to="/" className="auth-page-brand">
          <img src="/logo.png" alt="CourseMind" />
          <span>CourseMind</span>
        </Link>
        <div className="auth-page-card">
          <h1 className="section-title">Password updated</h1>
          <p className="section-subtitle">Redirecting you to login…</p>
          <Link to="/login"><Button>Log in now</Button></Link>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="auth-page">
        <Link to="/" className="auth-page-brand">
          <img src="/logo.png" alt="CourseMind" />
          <span>CourseMind</span>
        </Link>
        <div className="auth-page-card">
          <h1 className="section-title">Invalid link</h1>
          <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>
          <Link to="/forgot-password"><Button>Request new reset link</Button></Link>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ color: 'var(--blue-bold)' }}>Back to login</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <Link to="/" className="auth-page-brand">
        <img src="/logo.png" alt="CourseMind" />
        <span>CourseMind</span>
      </Link>
      <div className="auth-page-card">
        <h1 className="section-title">Set new password</h1>
        <p className="section-subtitle">
          You followed the link from your password reset email. Enter your new password below.
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{ marginBottom: 16 }}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            style={{ marginBottom: 24 }}
          />
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          <Link to="/login" style={{ color: 'var(--blue-bold)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  )
}
