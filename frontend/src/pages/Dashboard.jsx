import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyGuides } from '../api/guides'
import Button from '../components/Button'

export default function Dashboard() {
  const { user } = useAuth()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
              <Link key={g.id} to={`/guide/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                  <div className="icon-badge ib-blue">
                    <BookOpen size={20} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{g.title}</div>
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
            ))}
          </div>
        </div>
      )}
    </>
  )
}
