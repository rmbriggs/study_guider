import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { deleteAccount } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'

const CONFIRM_PHRASE = 'delete'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isConfirmValid = confirmText.trim().toLowerCase() === CONFIRM_PHRASE

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div
            className="nav-avatar"
            style={{ width: 48, height: 48, fontSize: 18 }}
          >
            {user?.email?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Profile</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user?.email}</p>
            {user?.email_verified && (
              <span style={{ fontSize: 12, color: 'var(--green-text)' }}>Email verified</span>
            )}
          </div>
        </div>
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
