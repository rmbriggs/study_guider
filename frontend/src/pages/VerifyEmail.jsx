import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { verifyEmail, resendVerificationEmail, getStoredToken } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  // Link verification: ?token=... in URL (user may not be logged in)
  useEffect(() => {
    if (!tokenFromUrl) return
    setLoading(true)
    setError('')
    verifyEmail({ token: tokenFromUrl })
      .then((data) => {
        if (data.user) login(data.user)
        const hasSession = getStoredToken()
        navigate(hasSession ? '/' : '/login', { replace: true, state: hasSession ? undefined : { message: 'Email verified. You can log in now.' } })
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, 'Verification failed'))
      })
      .finally(() => setLoading(false))
  }, [tokenFromUrl, login, navigate])

  const handleSubmitCode = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const data = await verifyEmail({ code: code.trim() })
      if (data.user) login(data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid or expired code'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResendLoading(true)
    try {
      await resendVerificationEmail()
      setSuccess('Verification email sent. Check your inbox.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend'))
    } finally {
      setResendLoading(false)
    }
  }

  if (tokenFromUrl) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%' }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your email…</p>
          ) : error ? (
            <>
              <p className="section-title" style={{ marginBottom: 8 }}>Verification failed</p>
              <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>
              <Link to="/login"><Button>Go to login</Button></Link>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%' }}>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>Log in to verify your email or use the link from your verification email.</p>
          <Link to="/login"><Button>Log in</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>Verify your email</h1>
        <p className="section-subtitle" style={{ marginBottom: 24 }}>
          We sent a 6-digit code to <strong>{user.email}</strong>. Enter it below, or use the link in the email.
        </p>
        <form onSubmit={handleSubmitCode}>
          <Input
            label="Verification code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            style={{ marginBottom: 16 }}
          />
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ marginBottom: 16, color: 'var(--green)', fontSize: 14 }}>{success}</div>}
          <Button type="submit" disabled={loading || code.length !== 6} style={{ width: '100%', marginBottom: 12 }}>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
        </form>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Didn't get the email?{' '}
          <button type="button" onClick={handleResend} disabled={resendLoading} className="link-button" style={{ color: 'var(--blue-bold)' }}>
            {resendLoading ? 'Sending…' : 'Resend verification email'}
          </button>
        </p>
        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          <Link to="/" style={{ color: 'var(--blue-bold)' }}>Back to dashboard</Link>
        </p>
      </div>
    </div>
  )
}
