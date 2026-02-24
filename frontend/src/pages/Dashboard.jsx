import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Mail, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyGuides, updateGuide } from '../api/guides'
import Button from '../components/Button'

export default function Dashboard() {
  const { user } = useAuth()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  useEffect(() => {
    setError('')
    getMyGuides()
      .then((data) => setGuides(Array.isArray(data) ? data : []))
      .catch((err) => {
        const status = err.response?.status
        if (status === 401) {
          setError('Please log in to see your guides.')
        } else {
          setError('Couldn\'t load your guides. Check your connection and try again.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' })
    } catch {
      return ''
    }
  }

  const handleStartRename = (g, e) => {
    e.preventDefault()
    e.stopPropagation()
    setEditTitleValue(g.title)
    setRenamingId(g.id)
  }

  const handleSaveRename = async () => {
    const title = (editTitleValue || '').trim()
    if (!renamingId || !title) {
      setRenamingId(null)
      return
    }
    setSavingTitle(true)
    try {
      await updateGuide(renamingId, { title })
      setGuides((prev) => prev.map((g) => (g.id === renamingId ? { ...g, title } : g)))
      setRenamingId(null)
    } catch (_) {}
    finally {
      setSavingTitle(false)
    }
  }

  const handleCancelRename = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    setRenamingId(null)
  }

  return (
    <>
      <div className="animate-in">
        <h1 className="section-title">My Study Guides</h1>
        <p className="section-subtitle">Open a guide below or create one from a course.</p>
      </div>
      {user && !user.email_verified && (
        <div className="card animate-in delay-1" style={{ marginBottom: 24, borderLeft: '4px solid var(--blue-bold)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Mail size={24} style={{ color: 'var(--blue-bold)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Verify your email to create study guides.</strong>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>Check your inbox or enter the code on the verify page.</p>
          </div>
          <Link to="/verify-email"><Button variant="accent">Verify email</Button></Link>
        </div>
      )}
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading guides…</p>}
      {error && (
        <div className="error-msg" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && guides.length === 0 && (
        <div className="card animate-in delay-3" style={{ maxWidth: 400 }}>
          <div className="icon-badge-lg icon-badge ib-purple">
            <BookOpen size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No guides yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            You don&apos;t have any study guides yet. Go to a course and add materials to a block, then generate a study guide from there.
          </p>
          <Link to="/courses">
            <Button variant="accent">Go to courses</Button>
          </Link>
        </div>
      )}
      {!loading && !error && guides.length > 0 && (
        <div className="animate-in delay-3">
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {guides.map((g) => (
              <div key={g.id}>
                {renamingId === g.id ? (
                  <div className="card" style={{ height: '100%' }}>
                    <div className="icon-badge ib-blue">
                      <BookOpen size={20} />
                    </div>
                    <input
                      type="text"
                      className="input"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                      style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="accent" onClick={handleSaveRename} disabled={savingTitle}>
                        {savingTitle ? 'Saving…' : 'Save'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelRename}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/guide/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                      <div className="icon-badge ib-blue">
                        <BookOpen size={20} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, flex: 1, minWidth: 0 }}>{g.title}</div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: 4, flexShrink: 0 }}
                          onClick={(e) => handleStartRename(g, e)}
                          aria-label="Rename guide"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {[g.course, g.professor_name].filter(Boolean).join(' · ') || 'No course or professor'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`chip ${g.status === 'completed' ? 'chip-green' : 'chip-outlined'}`}>
                          {g.status}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(g.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
