import { useState, useEffect } from 'react'
import { X, FileText, BookOpen, StickyNote } from 'lucide-react'
import { getProfessors, createProfessor, createCourse } from '../api/courses'
import { getApiErrorMessage } from '../utils/apiError'
import Button from './Button'
import Input from './Input'
import Select from './Select'
import NewProfessorModal from './NewProfessorModal'

export default function NewCourseModal({ open, onClose, onSuccess }) {
  const [officialName, setOfficialName] = useState('')
  const [nickname, setNickname] = useState('')
  const [professorSelect, setProfessorSelect] = useState('')
  const [professorOptions, setProfessorOptions] = useState([])
  const [newProfessorModalOpen, setNewProfessorModalOpen] = useState(false)
  const [personalDescription, setPersonalDescription] = useState('')
  const [syllabusFile, setSyllabusFile] = useState(null)
  const [handouts, setHandouts] = useState([])
  const [pastTests, setPastTests] = useState([])
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getProfessors()
        .then((list) => setProfessorOptions(list || []))
        .catch(() => setProfessorOptions([]))
    }
  }, [open])

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
    setLoading(true)
    try {
      let professorId = null
      if (professorSelect && professorSelect !== 'add-new') {
        const match = professorOptions.find((p) => p.name === professorSelect)
        if (match) professorId = match.id
      }

      const formData = new FormData()
      formData.append('official_name', official)
      formData.append('nickname', nick)
      if (professorId != null) formData.append('professor_id', professorId)
      if ((personalDescription || '').trim()) formData.append('personal_description', personalDescription.trim())
      if (syllabusFile) formData.append('syllabus', syllabusFile)
      handouts.forEach((f) => formData.append('handouts', f))
      pastTests.forEach((f) => formData.append('past_tests', f))
      notes.forEach((f) => formData.append('notes', f))

      const result = await createCourse(formData)
      onSuccess?.(result)
      onClose?.()
      setOfficialName('')
      setNickname('')
      setProfessorSelect('')
      setPersonalDescription('')
      setSyllabusFile(null)
      setHandouts([])
      setPastTests([])
      setNotes([])
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to create course'))
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New course</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
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
              onChange={(value) => {
                setProfessorSelect(value)
                if (value === 'add-new') setNewProfessorModalOpen(true)
              }}
              options={professorOptions.map((p) => p.name)}
              placeholder="Select a professor…"
              addNewValue="add-new"
              addNewLabel="Add new…"
            />
            <NewProfessorModal
              open={newProfessorModalOpen}
              onClose={() => {
                setNewProfessorModalOpen(false)
                if (professorSelect === 'add-new') setProfessorSelect('')
              }}
              onSuccess={(created) => {
                setProfessorOptions((prev) => [...prev, created])
                setProfessorSelect(created.name)
                setNewProfessorModalOpen(false)
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Syllabus (optional)
            </label>
            <div className="upload-tile" style={{ minHeight: 'auto' }}>
              <div className="upload-tile-icon ib-blue">
                <FileText size={22} />
              </div>
              <div className="upload-tile-title">Syllabus</div>
              <label className="upload-tile-trigger">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
                />
                {syllabusFile ? syllabusFile.name : 'Choose file'}
              </label>
              {syllabusFile && (
                <p className="upload-tile-files">{syllabusFile.name}</p>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              PDF or TXT. Optional materials for this course.
            </p>
            <div className="upload-tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="upload-tile" style={{ minHeight: 'auto' }}>
                <div className="upload-tile-icon ib-blue">
                  <FileText size={22} />
                </div>
                <div className="upload-tile-title">Handouts</div>
                <label className="upload-tile-trigger">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    multiple
                    onChange={(e) => setHandouts(Array.from(e.target.files || []))}
                  />
                  {handouts.length > 0 ? `${handouts.length} file(s)` : 'Choose files'}
                </label>
                {handouts.length > 0 && (
                  <p className="upload-tile-files">{handouts.map((f) => f.name).join(', ')}</p>
                )}
              </div>
              <div className="upload-tile" style={{ minHeight: 'auto' }}>
                <div className="upload-tile-icon ib-purple">
                  <BookOpen size={22} />
                </div>
                <div className="upload-tile-title">Past tests</div>
                <label className="upload-tile-trigger">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    multiple
                    onChange={(e) => setPastTests(Array.from(e.target.files || []))}
                  />
                  {pastTests.length > 0 ? `${pastTests.length} file(s)` : 'Choose files'}
                </label>
                {pastTests.length > 0 && (
                  <p className="upload-tile-files">{pastTests.map((f) => f.name).join(', ')}</p>
                )}
              </div>
              <div className="upload-tile" style={{ minHeight: 'auto' }}>
                <div className="upload-tile-icon ib-teal">
                  <StickyNote size={22} />
                </div>
                <div className="upload-tile-title">Notes</div>
                <label className="upload-tile-trigger">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    multiple
                    onChange={(e) => setNotes(Array.from(e.target.files || []))}
                  />
                  {notes.length > 0 ? `${notes.length} file(s)` : 'Choose files'}
                </label>
                {notes.length > 0 && (
                  <p className="upload-tile-files">{notes.map((f) => f.name).join(', ')}</p>
                )}
              </div>
            </div>
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
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Creating…' : 'Create course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
