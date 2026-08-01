export default function Button({
  children,
  variant = 'primary',
  full = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${full ? 'btn-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  )
}
