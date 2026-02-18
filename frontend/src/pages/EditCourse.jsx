import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getCourse, updateCourse, getProfessors } from '../api/courses'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'

export default function EditCourse() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [officialName, setOfficialName] = useState('')
  const [nickname, setNickname] = useState('')
  const [professorSelect, setProfessorSelect] = useState('')
  const [professorOptions, setProfessorOptions] = useState([])
  const [personalDescription, setPersonalDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getProfessors()
      .then((list) => setProfessorOptions(list || []))
      .catch(() => setProfessorOptions([]))
  }, [])

  useEffect(() => {
    if (!id) return
    getCourse(Number(id))
      .then((c) => {
        setOfficialName(c.official_name ?? '')
        setNickname(c.nickname ?? '')
        const profName = c.professor_name ?? ''
        setProfessorSelect(profName)
        setPersonalDescription(c.personal_description ?? '')
      })
      .catch(() => setFetchError('Course not found'))
      .finally(() => setFetching(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const official = (officialName || '').trim()
    const nick = (nickname || '').trim()
    if (!official) {
      setError('Official course name is required.')
      return
    }
    if (!nick) {
      setError('Nickname is required.')
      return
    }
    let professorId = null
    if (professorSelect) {
      const match = professorOptions.find((p) => p.name === professorSelect)
      if (match) professorId = match.id
    }
    setLoading(true)
    try {
      await updateCourse(Number(id), {
        official_name: official,
        nickname: nick,
        professor_id: professorId,
        personal_description: (personalDescription || '').trim() || null,
      })
      navigate('/courses')
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to update course'))
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
        <Link to="/courses" style={{ display: 'inline-block', marginTop: 16 }}>
          <Button variant="secondary">Back to courses</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <div className="modal-panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit course</h2>
          <Link to="/courses" className="modal-close" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit' }} aria-label="Back to courses">
            <ArrowLeft size={20} />
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <Input
            label="Official course name"
            placeholder="e.g. Bio 101"
            value={officialName}
            onChange={(e) => setOfficialName(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Input
            label="Nickname"
            placeholder="e.g. Biology"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 16 }}>
            <Select
              label="Professor"
              value={professorSelect}
              onChange={setProfessorSelect}
              options={professorOptions.map((p) => p.name)}
              placeholder="Select a professor…"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Syllabus
            </label>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              File uploads cannot be changed here. Current syllabus is stored on the server.
            </p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Personal description (optional)
            </label>
            <textarea
              className="textarea"
              placeholder="Your notes about this course, what to focus on, etc."
              value={personalDescription}
              onChange={(e) => setPersonalDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link to="/courses">
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
