import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus, BookOpen, Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-label">Overview</div>
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon ib-blue">
              <LayoutDashboard size={18} />
            </div>
            Dashboard
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon ib-purple">
              <FilePlus size={18} />
            </div>
            Create Guide
          </NavLink>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">Study</div>
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon ib-green">
              <BookOpen size={18} />
            </div>
            My Guides
          </NavLink>
        </div>
      </div>
      {user && (
        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  )
}
