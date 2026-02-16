import { Link, useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-logo-icon">
          <BookOpen size={18} />
        </div>
        Study Guider
      </Link>
      <div className="nav-links">
        {user && (
          <>
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/create" className="nav-link">Create Guide</Link>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        )}
      </div>
      {user && (
        <Link to="/settings" className="nav-avatar" title={`${user.email} — Account settings`}>
          {user.email.slice(0, 2).toUpperCase()}
        </Link>
      )}
    </nav>
  )
}
