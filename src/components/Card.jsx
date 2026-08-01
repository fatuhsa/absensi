export default function Card({ title, subtitle, children, className = '', actions }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
