import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import { getProfessors } from '../api/courses'
import Button from '../components/Button'
import NewProfessorModal from '../components/NewProfessorModal'

export default function ManageProfessors() {
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newProfessorOpen, setNewProfessorOpen] = useState(false)

  const loadProfessors = () => {
    setError('')
    getProfessors()
      .then((list) => {
        setProfessors(list ?? [])
        setError('')
      })
      .catch(() => {
        setProfessors([])
        setError('Failed to load professors')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadProfessors()
  }, [])

  return (
    <div className="animate-in">
      <h1 className="section-title">Manage Professors</h1>
      <p className="section-subtitle">Click a professor to edit their details.</p>
      <div style={{ marginBottom: 24 }}>
        <Button variant="accent" className="btn-accent" onClick={() => setNewProfessorOpen(true)}>
          <Plus size={18} />
          New professor
        </Button>
      </div>
      <NewProfessorModal
        open={newProfessorOpen}
        onClose={() => setNewProfessorOpen(false)}
        onSuccess={() => {
          setNewProfessorOpen(false)
          loadProfessors()
        }}
      />
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading professors…</p>}
      {!loading && error && professors.length > 0 && <div className="error-msg">{error}</div>}
      {!loading && professors.length === 0 && (
        <div className="card animate-in delay-1" style={{ maxWidth: 400 }}>
          <div className="icon-badge-lg icon-badge ib-purple">
            <Users size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No professors yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Add professors when creating a course or study guide.
          </p>
        </div>
      )}
      {!loading && professors.length > 0 && (
        <div className="animate-in delay-1">
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {professors.map((p) => (
              <Link key={p.id} to={`/professors/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                  <div className="icon-badge ib-purple">
                    <Users size={20} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  {p.specialties && (
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{p.specialties}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
