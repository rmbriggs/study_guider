import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister } from '../api/auth'
import { getApiErrorMessage } from '../utils/apiError'
import Button from '../components/Button'
import Input from '../components/Input'

const SIGNUP_FIELDS = [
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
      const data = await apiRegister(formData.email, formData.password)
      login(data.user)
      navigate('/')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>Sign up</h1>
        <p className="section-subtitle" style={{ marginBottom: 24 }}>Create an account to save your study guides.</p>
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
        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--blue-bold)' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
