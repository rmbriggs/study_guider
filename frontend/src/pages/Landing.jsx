import { Link } from 'react-router-dom'
import { BookOpen, BarChart3, HelpCircle, FolderOpen } from 'lucide-react'
import Button from '../components/Button'

export default function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <img src="/logo.png" alt="CourseMind" />
          <span>CourseMind</span>
        </Link>
        <nav className="landing-nav">
          <Link to="/login" className="landing-nav-link">Log in</Link>
          <Link to="/register" className="landing-nav-cta">
            <Button variant="primary">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <h1 className="landing-hero-title">
            AI-powered study guides tailored to your professor
          </h1>
          <p className="landing-hero-subtitle">
            CourseMind turns your course materials—past exams, handouts, and notes—into study guides that match how your professor actually tests.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register">
              <Button variant="primary" className="landing-btn-lg">Get started free</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="landing-btn-lg">Log in</Button>
            </Link>
          </div>
        </section>

        <section className="landing-problem">
          <h2>The problem</h2>
          <p>
            Students spend hours making study guides that are too broad, cover the wrong material, or use the wrong framing for their specific professor. A student in Biology 101 needs a very different guide than a student in Organic Chemistry—even for the same topic—because professors test differently. Generic AI tools don&apos;t know what <em>this professor</em> tests.
          </p>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <div className="landing-feature-icon ib-purple">
              <BookOpen size={24} />
            </div>
            <h3>Personalized study guides</h3>
            <p>From your materials—past exams, handouts, notes. Guides prioritize exactly what has appeared on this professor&apos;s past exams and use their terminology.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon ib-blue">
              <BarChart3 size={24} />
            </div>
            <h3>Professor learning</h3>
            <p>Use &quot;Analyze block&quot; to correlate past exams with handouts. The app learns topic frequency, question formats, and style—so every new guide gets smarter.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon ib-green">
              <HelpCircle size={24} />
            </div>
            <h3>Professor quiz</h3>
            <p>Answer 5 short questions per professor (exam style, emphasis, weak areas). Your answers are passed into the AI so guides match what you already know.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon ib-teal">
              <FolderOpen size={24} />
            </div>
            <h3>Organized by course</h3>
            <p>Courses, professors, and test blocks. Drag-and-drop to reorder. Upload PDF, DOCX, and more—everything in one place.</p>
          </div>
        </section>

        <section className="landing-cta">
          <h2>Ready to study smarter?</h2>
          <p>Join CourseMind and get study guides that focus on what your professor actually tests.</p>
          <Link to="/register">
            <Button variant="primary" className="landing-btn-lg">Sign up free</Button>
          </Link>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--blue-bold)', fontWeight: 500 }}>Log in</Link>
          </p>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="landing-logo">
          <img src="/logo.png" alt="CourseMind" />
          <span>CourseMind</span>
        </Link>
        <div className="landing-footer-links">
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
