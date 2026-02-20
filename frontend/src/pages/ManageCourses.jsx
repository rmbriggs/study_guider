import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Plus } from 'lucide-react'
import { getCourses } from '../api/courses'
import Button from '../components/Button'
import NewCourseModal from '../components/NewCourseModal'

export default function ManageCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newCourseOpen, setNewCourseOpen] = useState(false)

  const loadCourses = () => {
    getCourses()
      .then(setCourses)
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadCourses()
  }, [])

  return (
    <div className="animate-in">
      <h1 className="section-title">Manage Courses</h1>
      <p className="section-subtitle">Click a course to edit its details.</p>
      <div style={{ marginBottom: 24 }}>
        <Button variant="accent" className="btn-accent" onClick={() => setNewCourseOpen(true)}>
          <Plus size={18} />
          New course
        </Button>
      </div>
      <NewCourseModal
        open={newCourseOpen}
        onClose={() => setNewCourseOpen(false)}
        onSuccess={(created) => {
          setNewCourseOpen(false)
          loadCourses()
          if (created?.id) navigate(`/courses/${created.id}`)
        }}
      />
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading courses…</p>}
      {error && <div className="error-msg">{error}</div>}
      {!loading && !error && courses.length === 0 && (
        <div className="card animate-in delay-1" style={{ maxWidth: 400 }}>
          <div className="icon-badge-lg icon-badge ib-blue">
            <GraduationCap size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No courses yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Add courses when creating a study guide, or from the Create Guide page.
          </p>
        </div>
      )}
      {!loading && !error && courses.length > 0 && (
        <div className="animate-in delay-1">
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {courses.map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                  <div className="icon-badge ib-blue">
                    <GraduationCap size={20} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{c.nickname}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {c.official_name}
                    {c.professor_name ? ` · ${c.professor_name}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
