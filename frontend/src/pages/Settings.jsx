import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { deleteAccount, updateUsername } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

const CONFIRM_PHRASE = 'delete'

export default function Settings() {
  const { user, logout, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usernameValue, setUsernameValue] = useState(user?.username ?? '')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState(false)

  useEffect(() => {
    if (user?.username != null) setUsernameValue(user.username)
  }, [user?.username])

  const isConfirmValid = confirmText.trim().toLowerCase() === CONFIRM_PHRASE
  const usernameChanged = usernameValue.trim() !== (user?.username ?? '')

  const handleUsernameSubmit = async (e) => {
    e.preventDefault()
    if (!usernameChanged || usernameLoading) return
    setUsernameError('')
    setUsernameSuccess(false)
    setUsernameLoading(true)
    try {
      const updated = await updateUsername(usernameValue.trim())
      updateUser(updated)
      setUsernameSuccess(true)
    } catch (err) {
      setUsernameError(getApiErrorMessage(err, 'Failed to update username'))
    } finally {
      setUsernameLoading(false)
    }
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!isConfirmValid || loading) return
    setError('')
    setLoading(true)
    try {
      await deleteAccount()
      logout()
      navigate('/login', { replace: true, state: { message: 'Your account has been deleted.' } })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in">
      <h1 className="section-title">Account settings</h1>
      <p className="section-subtitle" style={{ marginBottom: 32 }}>
        Manage your profile and account.
      </p>

      <div className="card" style={{ maxWidth: 560, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Appearance</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Choose how Study Guider looks. Dark theme uses warm charcoal tones for a cozy feel.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Sun size={18} />
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Moon size={18} />
            Dark
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div
            className="nav-avatar"
            style={{ width: 48, height: 48, fontSize: 18 }}
          >
            {(user?.username || user?.email)?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Profile</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{'@'}{user?.username} · {user?.email}</p>
            {user?.email_verified && (
              <span style={{ fontSize: 12, color: 'var(--green-text)' }}>Email verified</span>
            )}
          </div>
        </div>
        <form onSubmit={handleUsernameSubmit}>
          <Input
            label="Username"
            type="text"
            placeholder="jane_doe"
            value={usernameValue}
            onChange={(e) => setUsernameValue(e.target.value)}
            autoComplete="username"
            style={{ marginBottom: 12 }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            3–50 characters, letters, numbers, and underscores only. Must be unique.
          </p>
          {usernameError && <div className="error-msg" style={{ marginBottom: 12 }}>{usernameError}</div>}
          {usernameSuccess && <div style={{ fontSize: 14, color: 'var(--green-text)', marginBottom: 12 }}>Username updated.</div>}
          <Button type="submit" disabled={!usernameChanged || usernameLoading}>
            {usernameLoading ? 'Saving…' : 'Save username'}
          </Button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 560, borderLeft: '4px solid var(--pink-bold)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={20} style={{ color: 'var(--pink-bold)' }} />
          Danger zone
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Permanently delete your account and all your study guides. This cannot be undone.
        </p>
        <form onSubmit={handleDelete}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
            Type <strong>{CONFIRM_PHRASE}</strong> below to confirm:
          </label>
          <input
            type="text"
            className="input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
            style={{ marginBottom: 12, maxWidth: 280 }}
          />
          {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
          <Button
            type="submit"
            variant="danger"
            disabled={!isConfirmValid || loading}
          >
            {loading ? 'Deleting…' : 'Delete my account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
