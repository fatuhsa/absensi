export default function Empty({ icon = '📭', text = 'Belum ada data' }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p>{text}</p>
    </div>
  )
}
