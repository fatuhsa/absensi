export default function Input({ label, error, hint, className = '', ...props }) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="field-label">{label}</span>}
      <input className={`input ${error ? 'input-error' : ''}`} {...props} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
