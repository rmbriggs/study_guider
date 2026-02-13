import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { createGuide } from '../api/guides'
import Button from '../components/Button'
import Input from '../components/Input'

export default function CreateGuide() {
  const [title, setTitle] = useState('')
  const [professorName, setProfessorName] = useState('')
  const [userSpecs, setUserSpecs] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const list = Array.from(e.target.files || [])
    setFiles(list)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (files.length === 0) {
      setError('Please upload at least one file (PDF or TXT).')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title || 'Untitled Guide')
      formData.append('professor_name', professorName)
      formData.append('user_specs', userSpecs)
      files.forEach((f) => formData.append('files', f))
      const data = await createGuide(formData)
      navigate(`/guide/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create guide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="animate-in">
        <h1 className="section-title">Create study guide</h1>
        <p className="section-subtitle">
          Upload professor handouts, notes, or previous tests. Add professor name and any instructions.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="animate-in delay-2">
        <div className="card" style={{ marginBottom: 24 }}>
          <Input
            label="Guide title"
            placeholder="e.g. Midterm 1 Study Guide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Input
            label="Professor / course"
            placeholder="e.g. Dr. Smith — Biology 101"
            value={professorName}
            onChange={(e) => setProfessorName(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Your specifications (optional)
            </label>
            <textarea
              className="textarea"
              placeholder="e.g. Focus on chapters 3–5, emphasize definitions, include possible essay topics"
              value={userSpecs}
              onChange={(e) => setUserSpecs(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            Upload files (PDF or TXT)
          </label>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Handouts, notes, previous tests. Max 10 files, 10 MB each.
          </p>
          <input
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleFileChange}
            style={{ display: 'block', marginBottom: 8 }}
          />
          {files.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {files.length} file(s) selected: {files.map((f) => f.name).join(', ')}
            </p>
          )}
        </div>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <Button type="submit" variant="accent" disabled={loading || files.length === 0}>
          {loading ? 'Generating…' : 'Generate study guide'}
        </Button>
      </form>
    </>
  )
}
