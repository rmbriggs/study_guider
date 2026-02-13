import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FilePlus } from 'lucide-react'
import { getMyGuides } from '../api/guides'
import Button from '../components/Button'

export default function Dashboard() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyGuides()
      .then(setGuides)
      .catch(() => setError('Failed to load guides'))
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
        <p className="section-subtitle">Create a new guide or open one below.</p>
      </div>
      <div className="animate-in delay-2" style={{ marginBottom: 24 }}>
        <Link to="/create">
          <Button variant="accent" className="btn-accent">
            <FilePlus size={18} />
            Create study guide
          </Button>
        </Link>
      </div>
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading guides…</p>}
      {error && <div className="error-msg">{error}</div>}
      {!loading && !error && guides.length === 0 && (
        <div className="card animate-in delay-3" style={{ maxWidth: 400 }}>
          <div className="icon-badge-lg icon-badge ib-purple">
            <BookOpen size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No guides yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Upload handouts, notes, and past tests to generate your first study guide.
          </p>
          <Link to="/create">
            <Button variant="accent">Create your first guide</Button>
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
                    {g.professor_name || 'No professor'}
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
