import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Layout from '../components/Layout.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Alert from '../components/Alert.jsx'
import Spinner from '../components/Spinner.jsx'
import Empty from '../components/Empty.jsx'
import Modal from '../components/Modal.jsx'
import { LogIn, LogOut, Moon, AlarmClock, Camera } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// Flatten one attendance row into individual absen events with photos.
function toEvents(h) {
  const events = []
  if (h.check_in_time) events.push({ key: `${h.id}-in`, label: 'Masuk', time: h.check_in_time, icon: LogIn, photo: h.check_in_photo })
  if (h.check_out_time) events.push({ key: `${h.id}-out`, label: 'Pulang', time: h.check_out_time, icon: LogOut, photo: h.check_out_photo })
  if (h.overtime_in_time) events.push({ key: `${h.id}-ot-in`, label: 'Lembur Masuk', time: h.overtime_in_time, icon: Moon, photo: h.overtime_photo })
  if (h.overtime_out_time) events.push({ key: `${h.id}-ot-out`, label: 'Lembur Selesai', time: h.overtime_out_time, icon: AlarmClock, photo: h.overtime_out_photo })
  return events
}

export default function Report() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [emp, setEmp] = useState(null) // { employee, rows, loading, error } when a modal is open
  const [empError, setEmpError] = useState('')

  const load = () => {
    setError('')
    setData(null)
    api(`/report/monthly?year=${year}&month=${month}`)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
  }

  useEffect(load, [year, month])

  const shiftMonth = (delta) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  const count = (r, field) => (r[field] ? 1 : 0)
  const present = data?.rows?.reduce((s, r) => s + count(r, 'check_in_time'), 0) || 0
  const overtime = data?.rows?.reduce((s, r) => s + count(r, 'overtime_in_time'), 0) || 0

  const openEmployee = async (employeeId, name) => {
    setEmp({ employee: { id: employeeId, name }, rows: null })
    setEmpError('')
    try {
      const d = await api(`/report/employee/${employeeId}`)
      setEmp(d)
    } catch (e) {
      setEmpError(e.message)
    }
  }

  const empEvents = (emp?.rows || [])
    .flatMap((h) => toEvents(h).map((e) => ({ ...e, date: h.date })))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  return (
    <Layout>
      <div className="page">
        <div className="page-head">
          <div>
            <h2 className="page-title">Laporan</h2>
            <p className="page-sub">Rekap kehadiran bulanan.</p>
          </div>
        </div>

        <div className="month-nav">
          <Button variant="secondary" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">‹</Button>
          <div className="month-label">
            <strong>{MONTHS[month - 1]} {year}</strong>
          </div>
          <Button variant="secondary" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">›</Button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat stat-blue">
                <span className="stat-value">{present}</span>
                <span className="stat-label">Total Hadir</span>
              </div>
              <div className="stat stat-purple">
                <span className="stat-value">{overtime}</span>
                <span className="stat-label">Total Lembur</span>
              </div>
            </div>

            <Card title="Rekap Per Karyawan">
              {data.rows?.length ? (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Hadir</th>
                        <th>Lembur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <button
                              className="link-btn"
                              onClick={() => openEmployee(r.employee_id, r.employee_name)}
                            >
                              {r.employee_name}
                            </button>
                          </td>
                          <td>{count(r, 'check_in_time')}</td>
                          <td>{count(r, 'overtime_in_time')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text="Tidak ada data pada bulan ini." />
              )}
            </Card>
          </>
        )}
      </div>

      <Modal open={!!emp} onClose={() => setEmp(null)} title={`Riwayat ${emp?.employee?.name || ''}`}>
        {empError && <Alert type="error">{empError}</Alert>}
        {!emp?.rows ? (
          <Spinner />
        ) : empEvents.length === 0 ? (
          <Empty text="Belum ada riwayat absensi untuk karyawan ini." />
        ) : (
          <ul className="history-list">
            {empEvents.map((e) => (
              <li key={e.key} className="history-item">
                <div className="history-main">
                  <strong>{e.date}</strong>
                  <span className="muted">
                    <e.icon size={14} style={{ verticalAlign: '-2px' }} /> {e.label} — {e.time}
                  </span>
                </div>
                <div className="history-side">
                  {e.photo && (
                    <a
                      href={e.photo}
                      target="_blank"
                      rel="noreferrer"
                      className="photo-link"
                      aria-label={`Lihat foto ${e.label} ${e.date}`}
                    >
                      <Camera size={18} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </Layout>
  )
}
