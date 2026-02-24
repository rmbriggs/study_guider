import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { BookOpen, Copy, ArrowLeft, Pencil, Download } from 'lucide-react'
import { getGuide, updateGuide } from '../api/guides'
import Button from '../components/Button'

export default function GuideView() {
  const { id } = useParams()
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  useEffect(() => {
    if (!id) return
    getGuide(Number(id))
      .then(setGuide)
      .catch(() => setError('Guide not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (guide?.title != null) setEditTitleValue(guide.title)
  }, [guide?.title])

  const handleCopy = () => {
    if (!guide?.output?.content) return
    navigator.clipboard.writeText(guide.output.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!guide?.output?.content) return
    const sanitized = (guide.title || 'study-guide').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().slice(0, 200) || 'study-guide'
    const filename = `${sanitized}.md`
    const blob = new Blob([guide.output.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveTitle = async () => {
    const title = (editTitleValue || '').trim()
    if (!title || title === guide?.title || !id) {
      setEditingTitle(false)
      return
    }
    setSavingTitle(true)
    try {
      const updated = await updateGuide(Number(id), { title })
      setGuide(updated)
      setEditingTitle(false)
    } catch (_) {
      // keep editing
    } finally {
      setSavingTitle(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
  if (error) return <div className="error-msg">{error}</div>
  if (!guide) return null

  const content = guide.output?.content ?? ''
  const hasOutput = guide.output && content

  return (
    <>
      <div className="animate-in" style={{ marginBottom: 24 }}>
        <Link to="/dashboard" className="btn btn-ghost" style={{ display: 'inline-flex', marginBottom: 16, textDecoration: 'none', color: 'inherit' }}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        {editingTitle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <input
              type="text"
              className="input"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              style={{ flex: 1, minWidth: 200, fontSize: '1.5rem', fontWeight: 700 }}
              autoFocus
            />
            <Button variant="accent" onClick={handleSaveTitle} disabled={savingTitle}>
              {savingTitle ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => { setEditingTitle(false); setEditTitleValue(guide.title) }}>
              Cancel
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 className="section-title" style={{ marginBottom: 0 }}>{guide.title}</h1>
            <button
              type="button"
              onClick={() => { setEditTitleValue(guide.title); setEditingTitle(true) }}
              className="btn btn-ghost"
              style={{ padding: 4 }}
              aria-label="Rename guide"
            >
              <Pencil size={18} />
            </button>
          </div>
        )}
        <p className="section-subtitle">
          {[
            [guide.course, guide.professor_name].filter(Boolean).join(' · '),
            guide.sources?.length > 0 && `${guide.sources.length} source(s)`,
            guide.output?.model_used && `Generated with ${guide.output.model_used}`,
          ].filter(Boolean).join(' · ')}
        </p>
      </div>
      {!hasOutput && (
        <div className="card animate-in delay-2">
          <div className="icon-badge ib-yellow">
            <BookOpen size={20} />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            This guide has no content yet. Status: {guide.status}.
          </p>
        </div>
      )}
      {hasOutput && (
        <div className="card animate-in delay-2" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={handleDownload}>
              <Download size={16} />
              Download
            </Button>
            <Button variant="secondary" onClick={handleCopy}>
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
          </div>
          <div className="guide-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </>
  )
}
