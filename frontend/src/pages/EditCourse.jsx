import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, BookOpen, FileStack, Pencil, Plus, ExternalLink, Download, Upload } from 'lucide-react'
import {
  getCourse,
  updateCourse,
  getProfessors,
  getCourseMaterials,
  createTest,
  updateTest,
  deleteTest,
  updateAttachment,
  openAttachmentFile,
  downloadAttachment,
  openSyllabusFile,
  downloadSyllabus,
  addCourseFiles,
} from '../api/courses'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'

const ATTACHMENT_KIND_ORDER = { past_test: 0, handout: 1, note: 2 }
const ATTACHMENT_KIND_LABEL = { past_test: 'Past test', handout: 'Handout', note: 'Note' }
const ATTACHMENT_KIND_ICON = { past_test: BookOpen, handout: FileText, note: FileStack }

function sortAttachments(attachments) {
  return [...attachments].sort((a, b) => {
    const oa = ATTACHMENT_KIND_ORDER[a.attachment_kind] ?? 3
    const ob = ATTACHMENT_KIND_ORDER[b.attachment_kind] ?? 3
    if (oa !== ob) return oa - ob
    return a.id - b.id
  })
}

function SectionCard({
  title,
  testId,
  attachments,
  allSections,
  courseId,
  onReload,
  onRename,
  onDelete,
  isUncategorized,
}) {
  const [moveLoading, setMoveLoading] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(title)

  const handleMove = async (attachmentId, newTestId) => {
    setMoveLoading(attachmentId)
    try {
      await updateAttachment(courseId, attachmentId, { test_id: newTestId || null })
      onReload()
    } finally {
      setMoveLoading(null)
    }
  }

  const handleSaveName = async () => {
    const name = (editNameValue || '').trim()
    if (!name || name === title) {
      setEditingName(false)
      return
    }
    try {
      await onRename(testId, name)
      setEditingName(false)
      onReload()
    } catch (_) {}
  }

  const moveOptions = allSections.filter((s) => s.id !== testId)
  const sorted = sortAttachments(attachments)

  return (
    <div className="card card-static" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        {isUncategorized ? (
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        ) : editingName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <input
              type="text"
              className="input"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              style={{ flex: 1, minWidth: 120 }}
              autoFocus
            />
            <Button variant="accent" onClick={handleSaveName}>Save</Button>
            <Button variant="ghost" onClick={() => { setEditingName(false); setEditNameValue(title) }}>Cancel</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
            <button
              type="button"
              onClick={() => { setEditNameValue(title); setEditingName(true) }}
              className="btn btn-ghost"
              style={{ padding: 4 }}
              aria-label="Edit section name"
            >
              <Pencil size={14} />
            </button>
            {onDelete && (
              <Button variant="ghost" className="btn-danger" onClick={() => onDelete(testId)}>
                Remove section
              </Button>
            )}
          </div>
        )}
      </div>
      {sorted.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No files in this section.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sorted.map((att) => {
            const Icon = ATTACHMENT_KIND_ICON[att.attachment_kind] || FileText
            const label = ATTACHMENT_KIND_LABEL[att.attachment_kind] || att.attachment_kind
            return (
              <li
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--bg-tertiary)',
                }}
              >
                <span
                  className="icon-badge ib-blue"
                  style={{ width: 32, height: 32, marginBottom: 0, flexShrink: 0 }}
                >
                  <Icon size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14 }} title={att.file_name}>
                  {att.file_name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 13 }}
                    onClick={() => openAttachmentFile(courseId, att.id)}
                    title="Open"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 13 }}
                    onClick={() => downloadAttachment(courseId, att.id, att.file_name)}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                </div>
                <select
                  className="input"
                  style={{ width: 'auto', minWidth: 140, fontSize: 13 }}
                  value={att.test_id ?? ''}
                  disabled={!!moveLoading}
                  onChange={(e) => {
                    const v = e.target.value
                    handleMove(att.id, v === '' ? null : Number(v))
                  }}
                >
                  {moveOptions.map((s) => (
                    <option key={s.id ?? 'uncat'} value={s.id ?? ''}>{s.name}</option>
                  ))}
                </select>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

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
  const [syllabusFilePath, setSyllabusFilePath] = useState(null)
  const [materials, setMaterials] = useState({ tests: [], attachments: [] })
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [newSectionName, setNewSectionName] = useState('')
  const [addingSection, setAddingSection] = useState(false)
  const [filesUploading, setFilesUploading] = useState(false)
  const [filesError, setFilesError] = useState('')
  const [addFilesOpen, setAddFilesOpen] = useState(false)
  const handoutsInputRef = useRef(null)
  const pastTestsInputRef = useRef(null)
  const notesInputRef = useRef(null)

  useEffect(() => {
    getProfessors()
      .then((list) => setProfessorOptions(list || []))
      .catch(() => setProfessorOptions([]))
  }, [])

  useEffect(() => {
    if (!id) return
    setFetching(true)
    getCourse(Number(id))
      .then((c) => {
        setOfficialName(c.official_name ?? '')
        setNickname(c.nickname ?? '')
        setProfessorSelect(c.professor_name ?? '')
        setPersonalDescription(c.personal_description ?? '')
        setSyllabusFilePath(c.syllabus_file_path ?? null)
      })
      .catch(() => setFetchError('Course not found'))
      .finally(() => setFetching(false))
  }, [id])

  const loadMaterials = () => {
    if (!id) return
    setMaterialsLoading(true)
    getCourseMaterials(Number(id))
      .then(setMaterials)
      .catch(() => setMaterials({ tests: [], attachments: [] }))
      .finally(() => setMaterialsLoading(false))
  }

  useEffect(() => {
    if (!id || fetchError) return
    loadMaterials()
  }, [id, fetchError])

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

  const handleRenameSection = async (testId, name) => {
    await updateTest(Number(id), testId, { name: name.trim() })
  }

  const handleDeleteSection = async (testId) => {
    if (!window.confirm('Remove this section? Files in it will move to Uncategorized.')) return
    await deleteTest(Number(id), testId)
    loadMaterials()
  }

  const handleAddSection = async () => {
    const name = (newSectionName || '').trim() || 'Untitled section'
    try {
      await createTest(Number(id), { name })
      setNewSectionName('')
      setAddingSection(false)
      loadMaterials()
    } catch (_) {}
  }

  const handleAddFiles = async (e) => {
    e.preventDefault()
    setFilesError('')
    const formData = new FormData()
    let count = 0
    const h = handoutsInputRef.current?.files
    if (h?.length) for (let i = 0; i < h.length; i++) { formData.append('handouts', h[i]); count++ }
    const p = pastTestsInputRef.current?.files
    if (p?.length) for (let i = 0; i < p.length; i++) { formData.append('past_tests', p[i]); count++ }
    const n = notesInputRef.current?.files
    if (n?.length) for (let i = 0; i < n.length; i++) { formData.append('notes', n[i]); count++ }
    if (count === 0) {
      setFilesError('Select at least one file to add.')
      return
    }
    setFilesUploading(true)
    try {
      await addCourseFiles(courseId, formData)
      if (handoutsInputRef.current) handoutsInputRef.current.value = ''
      if (pastTestsInputRef.current) pastTestsInputRef.current.value = ''
      if (notesInputRef.current) notesInputRef.current.value = ''
      setAddFilesOpen(false)
      loadMaterials()
    } catch (err) {
      setFilesError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to add files'))
    } finally {
      setFilesUploading(false)
    }
  }

  const uncategorizedAttachments = (materials.attachments || []).filter((a) => a.test_id == null)
  const courseId = Number(id)
  const attachmentsByKind = {
    syllabus: syllabusFilePath ? [{ id: 'syllabus', file_name: 'Syllabus', attachment_kind: 'syllabus' }] : [],
    past_test: (materials.attachments || []).filter((a) => a.attachment_kind === 'past_test'),
    handout: (materials.attachments || []).filter((a) => a.attachment_kind === 'handout'),
    note: (materials.attachments || []).filter((a) => a.attachment_kind === 'note'),
  }
  const fileGroupConfig = [
    { key: 'syllabus', label: 'Syllabus', icon: FileText, canAdd: false },
    { key: 'past_test', label: 'Past tests', icon: BookOpen, canAdd: true },
    { key: 'handout', label: 'Handouts', icon: FileText, canAdd: true },
    { key: 'note', label: 'Notes', icon: FileStack, canAdd: true },
  ]

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
      <header style={{ marginBottom: 32 }}>
        <Link to="/courses" className="page-back-link">
          <ArrowLeft size={18} />
          Back to courses
        </Link>
        <h1 className="section-title" style={{ marginBottom: 4 }}>{nickname}</h1>
        <p className="section-subtitle" style={{ marginBottom: 0 }}>{officialName}</p>
      </header>

      <div className="card card-static" style={{ maxWidth: 560, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>Course details</h2>
        <form onSubmit={handleSubmit}>
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
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Personal description (optional)</label>
            <textarea
              className="textarea"
              placeholder="Your notes about this course, what to focus on, etc."
              value={personalDescription}
              onChange={(e) => setPersonalDescription(e.target.value)}
              rows={4}
              style={{ marginTop: 0 }}
            />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button type="submit" variant="accent" className="btn-accent" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>

      <div style={{ maxWidth: 560, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Files</h2>
          <Button
            variant="secondary"
            className="btn-secondary"
            onClick={() => { setAddFilesOpen((o) => !o); setFilesError('') }}
          >
            <Upload size={18} />
            Add files
          </Button>
        </div>
        {addFilesOpen && (
          <div className="card card-static" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Upload new files</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              PDF or TXT. Past tests will create a new section each. Syllabus cannot be changed here.
            </p>
            <form onSubmit={handleAddFiles}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Past tests</label>
                <input ref={pastTestsInputRef} type="file" accept=".pdf,.txt" multiple className="input" style={{ padding: 8 }} />
                <label className="form-label" style={{ marginBottom: 0 }}>Handouts</label>
                <input ref={handoutsInputRef} type="file" accept=".pdf,.txt" multiple className="input" style={{ padding: 8 }} />
                <label className="form-label" style={{ marginBottom: 0 }}>Notes</label>
                <input ref={notesInputRef} type="file" accept=".pdf,.txt" multiple className="input" style={{ padding: 8 }} />
              </div>
              {filesError && <div className="error-msg" style={{ marginBottom: 12 }}>{filesError}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="submit" variant="accent" className="btn-accent" disabled={filesUploading}>
                  {filesUploading ? 'Uploading…' : 'Upload'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setAddFilesOpen(false); setFilesError('') }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
        {fileGroupConfig.map(({ key, label, icon: Icon }) => {
          const items = attachmentsByKind[key] || []
          return (
            <div key={key} className="card card-static" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className="icon-badge ib-blue" style={{ width: 36, height: 36, marginBottom: 0 }}>
                  <Icon size={18} />
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</h3>
              </div>
              {items.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {key === 'syllabus' ? 'No syllabus uploaded.' : `No ${label.toLowerCase()} yet.`}
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {items.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: '1px solid var(--bg-tertiary)',
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14 }} title={item.file_name}>
                        {item.file_name}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px' }}
                          onClick={() => key === 'syllabus' ? openSyllabusFile(courseId) : openAttachmentFile(courseId, item.id)}
                          title="Open"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px' }}
                          onClick={() => key === 'syllabus' ? downloadSyllabus(courseId, item.file_name) : downloadAttachment(courseId, item.id, item.file_name)}
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Materials by test</h2>
          <Button variant="secondary" className="btn-secondary" onClick={() => setAddingSection((a) => !a)}>
            <Plus size={18} />
            Add test section
          </Button>
        </div>
        {addingSection && (
          <div className="card card-static" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="Section name (e.g. Midterm 1)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <Button variant="accent" onClick={handleAddSection}>Add</Button>
            <Button variant="ghost" onClick={() => { setAddingSection(false); setNewSectionName('') }}>Cancel</Button>
          </div>
        )}
        {materialsLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading materials…</p>
        ) : (
          <>
            <SectionCard
              title="Uncategorized"
              testId={null}
              attachments={uncategorizedAttachments}
              allSections={[{ id: null, name: 'Uncategorized' }, ...(materials.tests || [])]}
              courseId={courseId}
              onReload={loadMaterials}
              onRename={() => {}}
              isUncategorized
            />
            {(materials.tests || []).map((test) => (
              <SectionCard
                key={test.id}
                title={test.name}
                testId={test.id}
                attachments={(materials.attachments || []).filter((a) => a.test_id === test.id)}
                allSections={[{ id: null, name: 'Uncategorized' }, ...(materials.tests || [])]}
                courseId={courseId}
                onReload={loadMaterials}
                onRename={handleRenameSection}
                onDelete={handleDeleteSection}
                isUncategorized={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
