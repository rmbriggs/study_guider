import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FilePlus, BookOpen } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="sidebar">
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
    </aside>
  )
}
