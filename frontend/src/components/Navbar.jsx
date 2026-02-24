import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <img src="/logo.png" alt="CourseMind" className="nav-logo-img" />
        CourseMind
      </Link>
      <div className="nav-links">
        {user && (
          <>
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            <Link to="/professors" className="nav-link">Professors</Link>
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
