import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, BookOpen, FileStack, Pencil, Plus, Download, Upload, Trash2, MoreVertical, GripVertical } from 'lucide-react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  getCourse,
  updateCourse,
  getProfessors,
  getCourseMaterials,
  createTest,
  updateTest,
  deleteTest,
  updateAttachment,
  downloadAttachment,
  downloadSyllabus,
  addCourseFiles,
  deleteAttachment,
  deleteSyllabus,
  duplicateAttachment,
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

function getAttachmentTestIds(att) {
  if (Array.isArray(att?.test_ids) && att.test_ids.length > 0) return att.test_ids.filter((n) => typeof n === 'number')
  if (att?.test_id == null) return []
  return [att.test_id]
}

function AttachmentRow({
  att,
  fromTestId,
  sectionNameById,
  courseId,
  moveLoading,
  moveOptions,
  onAssign,
  onRemoveFromBlock,
  onRename,
  onDuplicate,
  onDeleteAttachment,
  onReload,
}) {
  const Icon = ATTACHMENT_KIND_ICON[att.attachment_kind] || FileText
  const label = ATTACHMENT_KIND_LABEL[att.attachment_kind] || att.attachment_kind
  const allowMultipleBlocks = !!att.allow_multiple_blocks
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(att.file_name)
  const [renameLoading, setRenameLoading] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const menuWrapRef = useRef(null)
  const testIds = getAttachmentTestIds(att)
  const alsoInNames = allowMultipleBlocks
    ? testIds
      .filter((tid) => tid != null && tid !== fromTestId)
      .map((tid) => sectionNameById?.[tid])
      .filter(Boolean)
    : []

  const draggableId = `att-${att.id}-from-${fromTestId ?? 'uncat'}`
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { attachment: att, fromTestId },
    disabled: !!moveLoading,
  })
  const dndStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.65 : 1,
  }

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e) => {
      if (!menuWrapRef.current) return
      if (menuWrapRef.current.contains(e.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  return (
    <li
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--bg-tertiary)',
        ...dndStyle,
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{
          width: 20,
          height: 20,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          cursor: moveLoading ? 'not-allowed' : 'grab',
          flexShrink: 0,
          userSelect: 'none',
        }}
        title="Drag"
      >
        <GripVertical size={16} />
      </span>
      <span
        className="icon-badge ib-blue"
        style={{ width: 30, height: 30, marginBottom: 0, flexShrink: 0 }}
      >
        <Icon size={15} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (editNameValue || '').trim()
                  if (v && v !== att.file_name) {
                    setRenameLoading(true)
                    onRename(att, v).then(() => { setEditingName(false); setRenameLoading(false) }).catch(() => setRenameLoading(false))
                  } else setEditingName(false)
                }
                if (e.key === 'Escape') setEditingName(false)
              }}
              style={{ flex: 1, minWidth: 120, fontSize: 14 }}
              autoFocus
              disabled={renameLoading}
            />
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: 12 }}
              onClick={() => {
                const v = (editNameValue || '').trim()
                if (v && v !== att.file_name) {
                  setRenameLoading(true)
                  onRename(att, v).then(() => { setEditingName(false); setRenameLoading(false) }).catch(() => setRenameLoading(false))
                } else setEditingName(false)
              }}
              disabled={renameLoading || !(editNameValue || '').trim() || (editNameValue || '').trim() === att.file_name}
            >
              {renameLoading ? '…' : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => { setEditingName(false); setEditNameValue(att.file_name) }}>Cancel</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.file_name}>
              {att.file_name}
            </div>
            {allowMultipleBlocks && alsoInNames.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Also in: {alsoInNames.slice(0, 2).join(', ')}{alsoInNames.length > 2 ? ` +${alsoInNames.length - 2}` : ''}
              </div>
            )}
          </>
        )}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '4px 8px', fontSize: 13 }}
          onClick={() => downloadAttachment(courseId, att.id, att.file_name)}
          title="Download"
        >
          <Download size={14} />
        </button>
        {onDeleteAttachment && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 13, color: 'var(--color-error)' }}
            onClick={async () => {
              if (!window.confirm(`Delete "${att.file_name}"? This cannot be undone.`)) return
              setDeleting(true)
              try {
                await onDeleteAttachment(att.id)
                onReload()
              } finally {
                setDeleting(false)
              }
            }}
            disabled={deleting}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div ref={menuWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '4px 6px' }}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={!!moveLoading}
          title="Assign to…"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div
            className="select-menu"
            role="menu"
            style={{ right: 0, left: 'auto', minWidth: 200 }}
          >
            {onRename && (
              <button
                type="button"
                className="select-option"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setEditNameValue(att.file_name)
                  setEditingName(true)
                }}
              >
                Rename
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                className="select-option"
                role="menuitem"
                disabled={duplicating}
                onClick={async () => {
                  setMenuOpen(false)
                  setDuplicating(true)
                  try {
                    await onDuplicate(att)
                    onReload()
                  } finally {
                    setDuplicating(false)
                  }
                }}
              >
                {duplicating ? 'Duplicating…' : 'Duplicate'}
              </button>
            )}
            <div style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              Assign to
            </div>
            {allowMultipleBlocks && fromTestId != null && testIds.includes(fromTestId) && (
              <button
                type="button"
                className="select-option"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onRemoveFromBlock(att, fromTestId)
                }}
              >
                Remove from this block
              </button>
            )}
            {moveOptions.map((s) => (
              <button
                key={s.id ?? 'uncat'}
                type="button"
                className="select-option"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onAssign(att, s.id ?? null)
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

function KindSection({
  title,
  attachments,
  fromTestId,
  sectionNameById,
  courseId,
  moveLoading,
  moveOptions,
  onAssign,
  onRemoveFromBlock,
  onRename,
  onDuplicate,
  onDeleteAttachment,
  onReload,
}) {
  const sorted = sortAttachments(attachments)
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sorted.length}</div>
      </div>
      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No files.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sorted.map((att) => (
            <AttachmentRow
              key={att.id}
              att={att}
              fromTestId={fromTestId}
              sectionNameById={sectionNameById}
              courseId={courseId}
              moveLoading={moveLoading}
              moveOptions={moveOptions}
              onAssign={onAssign}
              onRemoveFromBlock={onRemoveFromBlock}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDeleteAttachment={onDeleteAttachment}
              onReload={onReload}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function TestBlockCard({
  title,
  testId,
  attachments,
  allSections,
  courseId,
  onReload,
  onRename,
  onDelete,
  onDeleteAttachment,
  isUncategorized,
}) {
  const [moveLoading, setMoveLoading] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(title)
  const droppableId = testId == null ? 'uncat' : `test-${testId}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  const sectionNameById = Object.fromEntries((allSections || []).filter((s) => s?.id != null).map((s) => [s.id, s.name]))

  const setAttachmentTestIds = async (att, nextTestIds) => {
    setMoveLoading(att.id)
    try {
      await updateAttachment(courseId, att.id, { test_ids: nextTestIds })
      onReload()
    } finally {
      setMoveLoading(null)
    }
  }

  const handleAssign = async (att, targetTestId) => {
    const current = getAttachmentTestIds(att)
    if (att.allow_multiple_blocks) {
      if (targetTestId == null) {
        await setAttachmentTestIds(att, [])
        return
      }
      await setAttachmentTestIds(att, Array.from(new Set([...current, targetTestId])))
      return
    }
    await setAttachmentTestIds(att, targetTestId == null ? [] : [targetTestId])
  }

  const handleRemoveFromBlock = async (att, removeTestId) => {
    const current = getAttachmentTestIds(att)
    await setAttachmentTestIds(att, current.filter((tid) => tid !== removeTestId))
  }

  const handleRenameAttachment = async (att, newName) => {
    await updateAttachment(courseId, att.id, { file_name: newName })
    onReload()
  }

  const handleDuplicate = async (att) => {
    await duplicateAttachment(courseId, att.id)
    onReload()
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
  const pastTests = (attachments || []).filter((a) => a.attachment_kind === 'past_test')
  const handouts = (attachments || []).filter((a) => a.attachment_kind === 'handout')
  const notes = (attachments || []).filter((a) => a.attachment_kind === 'note')

  return (
    <div
      ref={setNodeRef}
      className="card card-static"
      style={{
        outline: isOver ? '2px solid var(--blue-bold)' : 'none',
        outlineOffset: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        {isUncategorized ? (
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </h3>
            <button
              type="button"
              onClick={() => { setEditNameValue(title); setEditingName(true) }}
              className="btn btn-ghost"
              style={{ padding: 4, flexShrink: 0 }}
              aria-label="Edit section name"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
        {!isUncategorized && onDelete && !editingName && (
          <Button variant="ghost" className="btn-danger" onClick={() => onDelete(testId)}>
            Remove
          </Button>
        )}
      </div>

      <KindSection
        title="Past tests"
        attachments={pastTests}
        fromTestId={testId}
        sectionNameById={sectionNameById}
        courseId={courseId}
        moveLoading={moveLoading}
        moveOptions={moveOptions}
        onAssign={handleAssign}
        onRemoveFromBlock={handleRemoveFromBlock}
        onRename={handleRenameAttachment}
        onDuplicate={handleDuplicate}
        onDeleteAttachment={onDeleteAttachment}
        onReload={onReload}
      />
      <KindSection
        title="Handouts"
        attachments={handouts}
        fromTestId={testId}
        sectionNameById={sectionNameById}
        courseId={courseId}
        moveLoading={moveLoading}
        moveOptions={moveOptions}
        onAssign={handleAssign}
        onRemoveFromBlock={handleRemoveFromBlock}
        onRename={handleRenameAttachment}
        onDuplicate={handleDuplicate}
        onDeleteAttachment={onDeleteAttachment}
        onReload={onReload}
      />
      <KindSection
        title="Notes"
        attachments={notes}
        fromTestId={testId}
        sectionNameById={sectionNameById}
        courseId={courseId}
        moveLoading={moveLoading}
        moveOptions={moveOptions}
        onAssign={handleAssign}
        onRemoveFromBlock={handleRemoveFromBlock}
        onRename={handleRenameAttachment}
        onDuplicate={handleDuplicate}
        onDeleteAttachment={onDeleteAttachment}
        onReload={onReload}
      />
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
  const [addFilesHandouts, setAddFilesHandouts] = useState([])
  const [addFilesPastTests, setAddFilesPastTests] = useState([])
  const [addFilesNotes, setAddFilesNotes] = useState([])
  const [filesAddedMessage, setFilesAddedMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [renamingFileId, setRenamingFileId] = useState(null)
  const [renamingFileValue, setRenamingFileValue] = useState('')
  const [filesMenuOpenId, setFilesMenuOpenId] = useState(null)
  const [filesMenuDuplicating, setFilesMenuDuplicating] = useState(false)
  const filesMenuWrapRef = useRef(null)
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

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return
    const { attachment, fromTestId } = active.data?.current || {}
    if (!attachment) return

    const overId = over.id
    let targetTestId = null
    if (overId !== 'uncat') {
      const s = String(overId)
      if (s.startsWith('test-')) {
        const n = Number(s.slice('test-'.length))
        if (!Number.isNaN(n)) targetTestId = n
      }
    }

    if ((fromTestId ?? null) === (targetTestId ?? null)) return

    const current = getAttachmentTestIds(attachment)
    let next = []
    if (attachment.allow_multiple_blocks) {
      next = current.filter((tid) => (fromTestId == null ? true : tid !== fromTestId))
      if (targetTestId != null && !next.includes(targetTestId)) next = [...next, targetTestId]
    } else {
      next = targetTestId == null ? [] : [targetTestId]
    }

    try {
      await updateAttachment(Number(id), attachment.id, { test_ids: next })
      loadMaterials()
    } catch (_) {}
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
    addFilesHandouts.forEach((f) => formData.append('handouts', f))
    addFilesPastTests.forEach((f) => formData.append('past_tests', f))
    addFilesNotes.forEach((f) => formData.append('notes', f))
    const count = addFilesHandouts.length + addFilesPastTests.length + addFilesNotes.length
    if (count === 0) {
      setFilesError('Select at least one file to add.')
      return
    }
    setFilesUploading(true)
    setFilesError('')
    setFilesAddedMessage('')
    try {
      await addCourseFiles(courseId, formData)
      setAddFilesHandouts([])
      setAddFilesPastTests([])
      setAddFilesNotes([])
      if (handoutsInputRef.current) handoutsInputRef.current.value = ''
      if (pastTestsInputRef.current) pastTestsInputRef.current.value = ''
      if (notesInputRef.current) notesInputRef.current.value = ''
      setFilesAddedMessage(`Added ${count} file(s). You can add more below or close.`)
      loadMaterials()
      getCourse(courseId).then((c) => setSyllabusFilePath(c.syllabus_file_path ?? null))
    } catch (err) {
      setFilesError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to add files'))
    } finally {
      setFilesUploading(false)
    }
  }

  const handleDeleteFile = async (key, item) => {
    const name = item.file_name || 'this file'
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(key === 'syllabus' ? 'syllabus' : item.id)
    try {
      if (key === 'syllabus') {
        await deleteSyllabus(courseId)
        setSyllabusFilePath(null)
      } else {
        await deleteAttachment(courseId, item.id)
      }
      loadMaterials()
    } catch (err) {
      setFilesError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to delete file'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAttachment = (attachmentId) => deleteAttachment(courseId, attachmentId)

  const handleRenameFileSave = async () => {
    if (!renamingFileId || !(renamingFileValue || '').trim()) {
      setRenamingFileId(null)
      return
    }
    try {
      await updateAttachment(courseId, renamingFileId, { file_name: renamingFileValue.trim() })
      loadMaterials()
      setRenamingFileId(null)
    } catch (err) {
      setFilesError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to rename file'))
    }
  }

  const handleDuplicateFromFiles = async (itemId) => {
    setFilesMenuDuplicating(true)
    try {
      await duplicateAttachment(courseId, itemId)
      loadMaterials()
      setFilesMenuOpenId(null)
    } catch (err) {
      setFilesError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to duplicate file'))
    } finally {
      setFilesMenuDuplicating(false)
    }
  }

  useEffect(() => {
    if (filesMenuOpenId == null) return
    const onPointerDown = (e) => {
      if (filesMenuWrapRef.current && filesMenuWrapRef.current.contains(e.target)) return
      setFilesMenuOpenId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [filesMenuOpenId])

  const uncategorizedAttachments = (materials.attachments || []).filter((a) => getAttachmentTestIds(a).length === 0)
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
            onClick={() => { setAddFilesOpen((o) => !o); setFilesError(''); setFilesAddedMessage('') }}
          >
            <Upload size={18} />
            Add files
          </Button>
        </div>
        {filesError && !addFilesOpen && (
          <div className="error-msg" style={{ marginBottom: 16 }}>{filesError}</div>
        )}
        {addFilesOpen && (
          <div className="card card-static" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Upload new files</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              PDF, TXT, MD, DOC, DOCX, RTF, ODT, or HTML. Select multiple files per category (e.g. several handouts at once), then click Upload. Past tests create a new section each. Syllabus cannot be changed here.
            </p>
            {filesAddedMessage && (
              <p style={{ fontSize: 14, color: 'var(--green-bold)', marginBottom: 12 }}>{filesAddedMessage}</p>
            )}
            <form onSubmit={handleAddFiles}>
              <div className="upload-tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                <div className="upload-tile" style={{ minHeight: 'auto' }}>
                  <div className="upload-tile-icon ib-purple">
                    <BookOpen size={22} />
                  </div>
                  <div className="upload-tile-title">Past tests</div>
                  <label className="upload-tile-trigger">
                    <input
                      ref={pastTestsInputRef}
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx,.rtf,.odt,.html,.htm"
                      multiple
                      onChange={(e) => setAddFilesPastTests(Array.from(e.target.files || []))}
                    />
                    {addFilesPastTests.length > 0 ? `${addFilesPastTests.length} file(s)` : 'Choose files'}
                  </label>
                  {addFilesPastTests.length > 0 && (
                    <p className="upload-tile-files">{addFilesPastTests.map((f) => f.name).join(', ')}</p>
                  )}
                </div>
                <div className="upload-tile" style={{ minHeight: 'auto' }}>
                  <div className="upload-tile-icon ib-blue">
                    <FileText size={22} />
                  </div>
                  <div className="upload-tile-title">Handouts</div>
                  <label className="upload-tile-trigger">
                    <input
                      ref={handoutsInputRef}
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx,.rtf,.odt,.html,.htm"
                      multiple
                      onChange={(e) => setAddFilesHandouts(Array.from(e.target.files || []))}
                    />
                    {addFilesHandouts.length > 0 ? `${addFilesHandouts.length} file(s)` : 'Choose files'}
                  </label>
                  {addFilesHandouts.length > 0 && (
                    <p className="upload-tile-files">{addFilesHandouts.map((f) => f.name).join(', ')}</p>
                  )}
                </div>
                <div className="upload-tile" style={{ minHeight: 'auto' }}>
                  <div className="upload-tile-icon ib-teal">
                    <FileStack size={22} />
                  </div>
                  <div className="upload-tile-title">Notes</div>
                  <label className="upload-tile-trigger">
                    <input
                      ref={notesInputRef}
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx,.rtf,.odt,.html,.htm"
                      multiple
                      onChange={(e) => setAddFilesNotes(Array.from(e.target.files || []))}
                    />
                    {addFilesNotes.length > 0 ? `${addFilesNotes.length} file(s)` : 'Choose files'}
                  </label>
                  {addFilesNotes.length > 0 && (
                    <p className="upload-tile-files">{addFilesNotes.map((f) => f.name).join(', ')}</p>
                  )}
                </div>
              </div>
              {filesError && <div className="error-msg" style={{ marginBottom: 12 }}>{filesError}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="submit" variant="accent" className="btn-accent" disabled={filesUploading}>
                  {filesUploading ? 'Uploading…' : 'Upload'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setAddFilesOpen(false); setFilesError(''); setAddFilesHandouts([]); setAddFilesPastTests([]); setAddFilesNotes([]) }}>
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
                      {key !== 'syllabus' && renamingFileId === item.id ? (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="text"
                            className="input"
                            value={renamingFileValue}
                            onChange={(e) => setRenamingFileValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFileSave()
                              if (e.key === 'Escape') setRenamingFileId(null)
                            }}
                            style={{ flex: 1, minWidth: 120, fontSize: 14 }}
                            autoFocus
                          />
                          <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={handleRenameFileSave}>Save</button>
                          <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => { setRenamingFileId(null) }}>Cancel</button>
                        </div>
                      ) : (
                        <span style={{ flex: 1, minWidth: 0, fontSize: 14 }} title={item.file_name}>
                          {item.file_name}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {key !== 'syllabus' && renamingFileId !== item.id && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px' }}
                            onClick={() => { setRenamingFileId(item.id); setRenamingFileValue(item.file_name) }}
                            title="Rename"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px' }}
                          onClick={() => key === 'syllabus' ? downloadSyllabus(courseId, item.file_name) : downloadAttachment(courseId, item.id, item.file_name)}
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', color: 'var(--color-error)' }}
                          onClick={() => handleDeleteFile(key, item)}
                          disabled={deletingId === (key === 'syllabus' ? 'syllabus' : item.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        {key !== 'syllabus' && (
                          <div ref={filesMenuOpenId === item.id ? filesMenuWrapRef : null} style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '4px 6px' }}
                              onClick={() => setFilesMenuOpenId((id) => (id === item.id ? null : item.id))}
                              aria-haspopup="menu"
                              aria-expanded={filesMenuOpenId === item.id}
                              title="More"
                            >
                              <MoreVertical size={14} />
                            </button>
                            {filesMenuOpenId === item.id && (
                              <div
                                className="select-menu"
                                role="menu"
                                style={{ right: 0, left: 'auto', minWidth: 140 }}
                              >
                                <button
                                  type="button"
                                  className="select-option"
                                  role="menuitem"
                                  disabled={filesMenuDuplicating}
                                  onClick={() => handleDuplicateFromFiles(item.id)}
                                >
                                  {filesMenuDuplicating ? 'Duplicating…' : 'Duplicate'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ maxWidth: 1200, width: '100%' }}>
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
          <DndContext onDragEnd={handleDragEnd}>
            <div className="test-block-grid" style={{ marginBottom: 16 }}>
              {(materials.tests || []).map((test) => (
                <TestBlockCard
                  key={test.id}
                  title={test.name}
                  testId={test.id}
                  attachments={(materials.attachments || []).filter((a) => getAttachmentTestIds(a).includes(test.id))}
                  allSections={[{ id: null, name: 'Uncategorized' }, ...(materials.tests || [])]}
                  courseId={courseId}
                  onReload={loadMaterials}
                  onRename={handleRenameSection}
                  onDelete={handleDeleteSection}
                  onDeleteAttachment={handleDeleteAttachment}
                  isUncategorized={false}
                />
              ))}
            </div>

            <TestBlockCard
              title="Uncategorized"
              testId={null}
              attachments={uncategorizedAttachments}
              allSections={[{ id: null, name: 'Uncategorized' }, ...(materials.tests || [])]}
              courseId={courseId}
              onReload={loadMaterials}
              onRename={() => {}}
              onDeleteAttachment={handleDeleteAttachment}
              isUncategorized
            />
          </DndContext>
        )}
      </div>
    </div>
  )
}
