import { useState } from 'react'
import { X } from 'lucide-react'
import { createProfessor } from '../api/courses'
import { getApiErrorMessage } from '../utils/apiError'
import Button from './Button'
import Input from './Input'

export default function NewProfessorModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      const result = await createProfessor({
        name: trimmedName,
        specialties: (specialties || '').trim() || null,
        description: (description || '').trim() || null,
      })
      onSuccess?.(result)
      onClose?.()
      setName('')
      setSpecialties('')
      setDescription('')
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to create professor'))
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} style={{ zIndex: 210 }}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New professor</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
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
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Creating…' : 'Add professor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
