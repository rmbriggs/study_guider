import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList, RefreshCw, Trash2 } from 'lucide-react'
import { getProfessor, generateProfessorQuiz, updateProfessorQuizAnswers, deleteProfessorQuiz } from '../api/courses'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'

export default function ProfessorQuiz() {
  const { id } = useParams()
  const [professor, setProfessor] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const [fetching, setFetching] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})

  const loadProfessor = () => {
    if (!id) return
    setFetchError('')
    getProfessor(Number(id))
      .then((p) => {
        setProfessor(p)
        const quiz = p.study_guide_quiz || {}
        setAnswers(quiz.answers || {})
      })
      .catch(() => setFetchError('Professor not found'))
      .finally(() => setFetching(false))
  }

  useEffect(() => {
    setFetching(true)
    loadProfessor()
  }, [id])

  const handleGenerate = async () => {
    setError('')
    setGenerating(true)
    try {
      const updated = await generateProfessorQuiz(Number(id))
      setProfessor(updated)
      setAnswers(updated.study_guide_quiz?.answers || {})
    } catch (err) {
      const msg = err.response?.data?.detail || getApiErrorMessage(err, 'Failed to generate questions')
      setError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    setError('')
    setGenerating(true)
    try {
      const updated = await generateProfessorQuiz(Number(id))
      setProfessor(updated)
      setAnswers(updated.study_guide_quiz?.answers || {})
    } catch (err) {
      const msg = err.response?.data?.detail || getApiErrorMessage(err, 'Failed to regenerate questions')
      setError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }

  const handleSaveAnswers = async () => {
    setError('')
    setSaving(true)
    try {
      const updated = await updateProfessorQuizAnswers(Number(id), answers)
      setProfessor(updated)
      setAnswers(updated.study_guide_quiz?.answers || {})
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to save answers'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!window.confirm('Delete this quiz? You can generate a new one anytime.')) return
    setError('')
    setDeleting(true)
    try {
      const updated = await deleteProfessorQuiz(Number(id))
      setProfessor(updated)
      setAnswers({})
    } catch (err) {
      setError(err.response?.data?.detail || getApiErrorMessage(err, 'Failed to delete quiz'))
    } finally {
      setDeleting(false)
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

  const quiz = professor?.study_guide_quiz || {}
  const questions = Array.isArray(quiz.questions) ? quiz.questions : []
  const hasQuestions = questions.length > 0

  return (
    <div className="animate-in">
      <div className="modal-panel" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Study guide quiz</h2>
          <Link
            to={`/professors/${id}`}
            className="modal-close"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit' }}
            aria-label="Back to professor"
          >
            <ArrowLeft size={20} />
          </Link>
        </div>
        <div className="modal-body">
          {professor && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              For <strong>{professor.name}</strong>. Your answers are used when generating study guides so the AI can tailor content to your needs.
            </p>
          )}

          {!hasQuestions && (
            <>
              <p style={{ marginBottom: 16 }}>
                Generate 5 multiple-choice questions about this professor (exam style, emphasis, weak areas). Your choices are passed to the AI when you create a study guide.
              </p>
              {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
              <Button variant="accent" onClick={handleGenerate} disabled={generating}>
                <ClipboardList size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                {generating ? 'Generating…' : 'Generate 5 questions'}
              </Button>
            </>
          )}

          {hasQuestions && (
            <>
              <div style={{ marginBottom: 20 }}>
                {questions.map((q) => (
                  <div key={q.id} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>
                      {q.text}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(q.options && q.options.length > 0)
                        ? q.options.map((opt) => (
                            <label
                              key={opt}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                cursor: 'pointer',
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: answers[q.id] === opt ? 'var(--bg-secondary)' : 'transparent',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={() => handleAnswerChange(q.id, opt)}
                              />
                              <span style={{ fontSize: 14 }}>{opt}</span>
                            </label>
                          ))
                        : (
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                              No options — click Regenerate questions for multiple choice.
                            </p>
                          )}
                    </div>
                  </div>
                ))}
              </div>
              {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Button variant="accent" onClick={handleSaveAnswers} disabled={saving}>
                    {saving ? 'Saving…' : 'Save answers'}
                  </Button>
                  <Button variant="secondary" onClick={handleRegenerate} disabled={generating}>
                    <RefreshCw size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Regenerate questions
                  </Button>
                </div>
                <div>
                  <Button variant="secondary" onClick={handleDeleteQuiz} disabled={deleting}>
                    <Trash2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    {deleting ? 'Deleting…' : 'Delete quiz'}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <Link to={id ? `/professors/${id}` : '/professors'} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              ← Back to professor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
