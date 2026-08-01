export default function Spinner({ text = 'Memuat...' }) {
  return (
    <div className="spinner-wrap">
      <span className="spinner spinner-lg" />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  )
}
