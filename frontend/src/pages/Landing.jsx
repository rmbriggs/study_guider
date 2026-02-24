import { Link } from 'react-router-dom'
import { BookOpen, Sparkles, GraduationCap } from 'lucide-react'
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
            Study smarter with AI-generated guides
          </h1>
          <p className="landing-hero-subtitle">
            Add your courses and materials. CourseMind turns them into clear, personalized study guides so you can focus on understanding, not organizing.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register">
              <Button variant="primary" className="landing-btn-lg">Create free account</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="landing-btn-lg">I already have an account</Button>
            </Link>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <div className="landing-feature-icon ib-blue">
              <BookOpen size={24} />
            </div>
            <h3>One place for your courses</h3>
            <p>Add courses, attach syllabi and materials, and keep everything in one place.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon ib-purple">
              <Sparkles size={24} />
            </div>
            <h3>AI study guides</h3>
            <p>Generate clear, structured study guides from your materials in one click.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon ib-green">
              <GraduationCap size={24} />
            </div>
            <h3>Built for students</h3>
            <p>Designed around how you actually study—guides, quizzes, and progress in one app.</p>
          </div>
        </section>

        <section className="landing-cta">
          <h2>Ready to study smarter?</h2>
          <p>Join CourseMind and turn your course materials into guides that actually help.</p>
          <Link to="/register">
            <Button variant="primary" className="landing-btn-lg">Get started for free</Button>
          </Link>
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
