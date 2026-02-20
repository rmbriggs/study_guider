import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Request failed'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <Link to="/" className="auth-page-brand">
          <img src="/logo.png" alt="CourseMind" />
          <span>CourseMind</span>
        </Link>
        <div className="auth-page-card">
          <h1 className="section-title">Check your email</h1>
          <p className="section-subtitle">
            If an account exists with that email, we sent password reset instructions.
          </p>
          <Link to="/login"><Button>Back to login</Button></Link>
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
        <h1 className="section-title">Forgot password</h1>
        <p className="section-subtitle">Enter your email and we'll send you a link to reset your password.</p>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ marginBottom: 24 }}
          />
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          <Link to="/login" style={{ color: 'var(--blue-bold)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  )
}
