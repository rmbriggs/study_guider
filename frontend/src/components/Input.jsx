export default function Input({ label, error, className = '', style, ...props }) {
  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <input className="input" {...props} />
      {error && <div className="error-msg">{error}</div>}
    </div>
  )
}
