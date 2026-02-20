import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

const SIGNUP_FIELDS = [
  { name: 'username', label: 'Username', type: 'text', placeholder: 'jane_doe', autoComplete: 'username', required: true },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email', required: true },
  { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password', required: true },
]

const initialFormData = Object.fromEntries(SIGNUP_FIELDS.map((f) => [f.name, '']))

export default function Register() {
  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiRegister(formData.email, formData.password, formData.username)
      login(data.user)
      navigate('/verify-email')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Make sure the backend is running (port 8000). See README for how to start it.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="auth-page-brand">
        <img src="/logo.png" alt="CourseMind" />
        <span>CourseMind</span>
      </Link>
      <div className="auth-page-card">
        <h1 className="section-title">Sign up</h1>
        <p className="section-subtitle">Create an account to save your study guides.</p>
        <form onSubmit={handleSubmit}>
          {SIGNUP_FIELDS.map((field, index) => (
            <Input
              key={field.name}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => updateField(field.name, e.target.value)}
              required={field.required}
              autoComplete={field.autoComplete}
              style={{ marginBottom: index === SIGNUP_FIELDS.length - 1 ? 24 : 16 }}
            />
          ))}
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--blue-bold)' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
