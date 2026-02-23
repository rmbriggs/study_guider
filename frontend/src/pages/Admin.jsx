import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAdminUsers, deleteUser } from '../api/admin'
import Button from '../components/Button'

export default function Admin() {
  const navigate = useNavigate()
  const { user: currentUser, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadUsers = () => {
    setError('')
    getAdminUsers()
      .then(setUsers)
      .catch((err) => {
        if (err.response?.status === 403) setError('You don’t have permission to view this page.')
        else setError('Failed to load users.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDelete = (u) => {
    if (!window.confirm(`Delete account "${u.username}" (${u.email})? This will permanently delete the user and all their data.`)) return
    setDeletingId(u.id)
    deleteUser(u.id)
      .then(() => {
        if (currentUser?.id === u.id) {
          logout()
          navigate('/login', { replace: true })
        } else {
          loadUsers()
        }
      })
      .catch(() => setError('Failed to delete user.'))
      .finally(() => setDeletingId(null))
  }

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' })
    } catch {
      return ''
    }
  }

  return (
    <div className="animate-in">
      <h1 className="section-title">Admin</h1>
      <p className="section-subtitle">View all users and their study guides. Delete accounts if needed.</p>

      {error && (
        <div className="error-msg" role="alert" style={{ marginBottom: 24 }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading users…</p>}

      {!loading && users.length === 0 && !error && (
        <div className="card animate-in delay-1" style={{ maxWidth: 400 }}>
          <div className="icon-badge-lg icon-badge ib-purple">
            <Users size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No users</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>There are no user accounts yet.</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="animate-in delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {users.map((u) => (
            <div key={u.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-expanded={expandedId === u.id}
                  >
                    {expandedId === u.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{u.username}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {u.email}
                      {u.email_verified ? ' · Verified' : ' · Unverified'}
                      {' · '}
                      {formatDate(u.created_at)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(u)}
                  disabled={deletingId === u.id}
                  style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                >
                  <Trash2 size={16} />
                  {deletingId === u.id ? 'Deleting…' : 'Delete account'}
                </Button>
              </div>
              {expandedId === u.id && (
                <div style={{ marginTop: 16, paddingLeft: 28, borderLeft: '2px solid var(--bg-tertiary)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Study guides ({u.study_guides?.length ?? 0})
                  </div>
                  {u.study_guides?.length === 0 ? (
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No study guides.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {u.study_guides?.map((g) => (
                        <li
                          key={g.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 14,
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <BookOpen size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{g.title || 'Untitled'}</span>
                          {(g.course || g.professor_name) && (
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {[g.course, g.professor_name].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: 12,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: g.status === 'completed' ? 'var(--green-soft)' : g.status === 'failed' ? 'var(--color-error-soft)' : 'var(--yellow-soft)',
                              color: g.status === 'completed' ? 'var(--green-text)' : g.status === 'failed' ? 'var(--color-error)' : 'var(--yellow-text)',
                            }}
                          >
                            {g.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
