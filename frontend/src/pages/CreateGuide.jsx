import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createGuide, getGuideOptions } from '../api/guides'
import { useAuth } from '../context/AuthContext'
import { verifyEmail } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import { FileText, BookOpen, StickyNote, ClipboardList } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import NewCourseModal from '../components/NewCourseModal'
import NewProfessorModal from '../components/NewProfessorModal'

export default function CreateGuide() {
  const { user, login } = useAuth()
  const [title, setTitle] = useState('')
  const [courseSelect, setCourseSelect] = useState('')
  const [professorSelect, setProfessorSelect] = useState('')
  const [newProfessorModalOpen, setNewProfessorModalOpen] = useState(false)
  const [userSpecs, setUserSpecs] = useState('')
  const [courseOptions, setCourseOptions] = useState([])
  const [professorOptions, setProfessorOptions] = useState([])

  const course = courseSelect === 'add-new' ? '' : courseSelect
  const professorName = professorSelect === 'add-new' ? '' : professorSelect

  const handleNewCourseSuccess = (created) => {
    setCourseSelect(created.nickname)
    setCourseOptions((prev) => [...new Set([...prev, created.nickname])].sort())
  }
  const handleNewCourseClose = () => {
    setCourseSelect('')
  }
  const [pastTests, setPastTests] = useState([])
  const [handouts, setHandouts] = useState([])
  const [studyGuides, setStudyGuides] = useState([])
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.email_verified) {
      getGuideOptions()
        .then(({ courses, professors }) => {
          setCourseOptions(courses || [])
          setProfessorOptions(professors || [])
        })
        .catch(() => {})
    }
  }, [user?.email_verified])

  const allFiles = [...pastTests, ...handouts, ...studyGuides, ...notes]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (user && !user.email_verified) {
      setError('Please verify your email address to create study guides.')
      return
    }
    if (allFiles.length === 0) {
      setError('Please upload at least one file (PDF or TXT).')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title || 'Untitled Guide')
      formData.append('course', course)
      formData.append('professor_name', professorName)
      formData.append('user_specs', userSpecs)
      pastTests.forEach((f) => formData.append('past_tests', f))
      handouts.forEach((f) => formData.append('handouts', f))
      studyGuides.forEach((f) => formData.append('study_guides', f))
      notes.forEach((f) => formData.append('notes', f))
      const data = await createGuide(formData)
      navigate(`/guide/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to create guide'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!verifyCode.trim() || verifyCode.length !== 6) return
    setVerifyError('')
    setVerifyLoading(true)
    try {
      const data = await verifyEmail({ code: verifyCode.trim() })
      if (data.user) login(data.user)
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, 'Invalid or expired code'))
    } finally {
      setVerifyLoading(false)
    }
  }

  if (user && !user.email_verified) {
    return (
      <>
        <div className="animate-in">
          <h1 className="section-title">Create study guide</h1>
          <p className="section-subtitle">Verify your email to create study guides.</p>
        </div>
        <div className="card animate-in delay-2" style={{ maxWidth: 480, marginBottom: 24 }}>
          <p style={{ marginBottom: 16 }}>You need to verify your email before you can create study guides. Check your inbox or enter the 6-digit code below.</p>
          <form onSubmit={handleVerifyCode} style={{ marginBottom: 16 }}>
            <Input
              label="Verification code"
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ marginBottom: 8 }}
            />
            {verifyError && <div className="error-msg" style={{ marginBottom: 8 }}>{verifyError}</div>}
            <Button type="submit" disabled={verifyLoading || verifyCode.length !== 6}>Verify</Button>
          </form>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            <Link to="/verify-email" style={{ color: 'var(--blue-bold)' }}>Open verify email page</Link> to resend the code.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="animate-in">
        <h1 className="section-title">Create study guide</h1>
        <p className="section-subtitle">
          Upload handouts, notes, or previous tests. Add name, course, professor, and any other details.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="animate-in delay-2">
        <div className="card" style={{ marginBottom: 24 }}>
          <Input
            label="Name"
            placeholder="e.g. Midterm 1 Study Guide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 16 }}>
            <Select
              label="Course"
              value={courseSelect}
              onChange={setCourseSelect}
              options={courseOptions}
              placeholder="Select a course…"
              addNewValue="add-new"
              addNewLabel="Add new…"
            />
            <NewCourseModal
              open={courseSelect === 'add-new'}
              onClose={handleNewCourseClose}
              onSuccess={handleNewCourseSuccess}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Select
              label="Professor"
              value={professorSelect}
              onChange={(value) => {
                setProfessorSelect(value)
                if (value === 'add-new') setNewProfessorModalOpen(true)
              }}
              options={professorOptions}
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
                setProfessorOptions((prev) => [...new Set([...prev, created.name])].sort())
                setProfessorSelect(created.name)
                setNewProfessorModalOpen(false)
              }}
            />
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Other details (optional)
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
        <div className="card card-static" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            PDF or TXT. Max 10 files total, 10 MB each.
          </p>
          <div className="upload-tiles">
            <div className="upload-tile">
              <div className="upload-tile-icon ib-orange">
                <ClipboardList size={22} />
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
                <p className="upload-tile-files">
                  {pastTests.map((f) => f.name).join(', ')}
                </p>
              )}
            </div>
            <div className="upload-tile">
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
                <p className="upload-tile-files">
                  {handouts.map((f) => f.name).join(', ')}
                </p>
              )}
            </div>
            <div className="upload-tile">
              <div className="upload-tile-icon ib-purple">
                <BookOpen size={22} />
              </div>
              <div className="upload-tile-title">Study guides</div>
              <label className="upload-tile-trigger">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  multiple
                  onChange={(e) => setStudyGuides(Array.from(e.target.files || []))}
                />
                {studyGuides.length > 0 ? `${studyGuides.length} file(s)` : 'Choose files'}
              </label>
              {studyGuides.length > 0 && (
                <p className="upload-tile-files">
                  {studyGuides.map((f) => f.name).join(', ')}
                </p>
              )}
            </div>
            <div className="upload-tile">
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
                <p className="upload-tile-files">
                  {notes.map((f) => f.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <Button type="submit" variant="accent" disabled={loading || allFiles.length === 0}>
          {loading ? 'Generating…' : 'Generate study guide'}
        </Button>
      </form>
    </>
  )
}
