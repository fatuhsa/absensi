import { useEffect, useState } from 'react'
import { api, getUser } from '../api.js'
import Layout from '../components/Layout.jsx'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'
import Alert from '../components/Alert.jsx'

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat ${accent ? `stat-${accent}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/report/today')
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <Alert type="error">{error}</Alert>
  if (!data) return <Spinner text="Memuat dashboard..." />

  const present = data.rows?.filter((r) => r.check_in_time).length || 0
  const total = data.rows?.length || 0

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Karyawan" value={total} accent="blue" />
        <StatCard label="Hadir Hari Ini" value={present} accent="green" />
        <StatCard label="Belum Hadir" value={Math.max(0, total - present)} accent="red" />
      </div>

      <Card title={`Kehadiran Hari Ini (${data.date || ''})`}>
        {data.rows?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Masuk</th>
                <th>Pulang</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee_name}</td>
                  <td>{r.check_in_time || '—'}</td>
                  <td>{r.check_out_time || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Belum ada data kehadiran hari ini.</p>
        )}
      </Card>
    </div>
  )
}

function EmployeeHome() {
  const user = getUser()
  const [history, setHistory] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/attendance/mine')
      .then((d) => setHistory(d))
      .catch((e) => setError(e.message))
  }, [])

  const today = history?.find((h) => {
    const d = new Date()
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    return h.date === iso
  })

  const statusBadge = (h) => {
    if (h.check_in_time && h.check_out_time) return <span className="badge badge-green">Selesai</span>
    if (h.check_in_time) return <span className="badge badge-blue">Masuk</span>
    return <span className="badge badge-gray">Belum</span>
  }

  return (
    <div className="page">
      <h2 className="page-title">Halo, {user?.username}</h2>
      {error && <Alert type="error">{error}</Alert>}

      <Card title="Status Hari Ini">
        {today ? (
          <div className="today-status">
            <div className="today-row">
              <span>Masuk</span>
              <strong>{today.check_in_time || '—'}</strong>
            </div>
            <div className="today-row">
              <span>Pulang</span>
              <strong>{today.check_out_time || '—'}</strong>
            </div>
            <div className="today-row">
              <span>Lembur</span>
              <strong>
                {today.overtime_in_time ? `${today.overtime_in_time} – ${today.overtime_out_time || '...'}` : '—'}
              </strong>
            </div>
            <div className="today-row">
              <span>Status</span>
              {statusBadge(today)}
            </div>
          </div>
        ) : (
          <p className="muted">Belum ada absensi hari ini. Silakan lakukan absensi masuk.</p>
        )}
      </Card>

      <Card title="Riwayat Terakhir">
        {history?.length ? (
          <ul className="history-list">
            {history.slice(0, 5).map((h) => (
              <li key={h.id} className="history-item">
                <div>
                  <strong>{h.date}</strong>
                  <span className="muted">
                    {h.check_in_time || '—'} – {h.check_out_time || '—'}
                  </span>
                </div>
                {statusBadge(h)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Belum ada riwayat.</p>
        )}
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const user = getUser()
  return <Layout>{user?.role === 'admin' ? <AdminDashboard /> : <EmployeeHome />}</Layout>
}
