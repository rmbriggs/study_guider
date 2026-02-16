import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user } = useAuth()

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
          </>
        )}
      </div>
      {user && (
        <Link to="/settings" className="nav-avatar" title={`@${user.username ?? user.email} — Account settings`}>
          {(user.username || user.email).slice(0, 2).toUpperCase()}
        </Link>
      )}
    </nav>
  )
}
