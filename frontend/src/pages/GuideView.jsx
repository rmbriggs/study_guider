import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { BookOpen, Copy, ArrowLeft } from 'lucide-react'
import { getGuide } from '../api/guides'
import Button from '../components/Button'

export default function GuideView() {
  const { id } = useParams()
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    getGuide(Number(id))
      .then(setGuide)
      .catch(() => setError('Guide not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopy = () => {
    if (!guide?.output?.content) return
    navigator.clipboard.writeText(guide.output.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
  if (error) return <div className="error-msg">{error}</div>
  if (!guide) return null

  const content = guide.output?.content ?? ''
  const hasOutput = guide.output && content

  return (
    <>
      <div className="animate-in" style={{ marginBottom: 24 }}>
        <Link to="/" className="btn btn-ghost" style={{ display: 'inline-flex', marginBottom: 16, textDecoration: 'none', color: 'inherit' }}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <h1 className="section-title">{guide.title}</h1>
        <p className="section-subtitle">
          {guide.professor_name && `${guide.professor_name} · `}
          {guide.sources?.length > 0 && `${guide.sources.length} source(s)`}
          {guide.output?.model_used && ` · Generated with ${guide.output.model_used}`}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
