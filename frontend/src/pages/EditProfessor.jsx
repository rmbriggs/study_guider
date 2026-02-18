import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getProfessor, updateProfessor } from '../api/courses'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

export default function EditProfessor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!id) return
    getProfessor(Number(id))
      .then((p) => {
        setName(p.name ?? '')
        setSpecialties(p.specialties ?? '')
        setDescription(p.description ?? '')
      })
      .catch(() => setFetchError('Professor not found'))
      .finally(() => setFetching(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    setLoading(true)
    try {
      await updateProfessor(Number(id), {
        name: trimmedName,
        specialties: (specialties || '').trim() || null,
        description: (description || '').trim() || null,
      })
      navigate('/professors')
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to update professor'))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="animate-in">
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </div>
    )
  }
  if (fetchError) {
    return (
      <div className="animate-in">
        <div className="error-msg">{fetchError}</div>
        <Link to="/professors" style={{ display: 'inline-block', marginTop: 16 }}>
          <Button variant="secondary">Back to professors</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <div className="modal-panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit professor</h2>
          <Link to="/professors" className="modal-close" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit' }} aria-label="Back to professors">
            <ArrowLeft size={20} />
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <Input
            label="Name"
            placeholder="e.g. Dr. Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Input
            label="Specialties"
            placeholder="e.g. Cell biology, genetics"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Personality / tests
            </label>
            <textarea
              className="textarea"
              placeholder="How they teach, test style, what to expect, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link to="/professors">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
