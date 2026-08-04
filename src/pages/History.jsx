import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Layout from '../components/Layout.jsx'
import Card from '../components/Card.jsx'
import Alert from '../components/Alert.jsx'
import Spinner from '../components/Spinner.jsx'
import Empty from '../components/Empty.jsx'
import { LogIn, LogOut, Moon, AlarmClock, Camera } from 'lucide-react'

// Flatten a daily attendance record into individual absen events (newest first).
function toEvents(h) {
  const events = []
  if (h.check_in_time) events.push({ key: `${h.id}-in`, label: 'Masuk', time: h.check_in_time, icon: LogIn, photo: h.check_in_photo })
  if (h.check_out_time) events.push({ key: `${h.id}-out`, label: 'Pulang', time: h.check_out_time, icon: LogOut, photo: h.check_out_photo })
  if (h.overtime_in_time) events.push({ key: `${h.id}-ot-in`, label: 'Lembur Masuk', time: h.overtime_in_time, icon: Moon, photo: h.overtime_photo })
  if (h.overtime_out_time) events.push({ key: `${h.id}-ot-out`, label: 'Lembur Selesai', time: h.overtime_out_time, icon: AlarmClock, photo: h.overtime_out_photo })
  return events
}

export default function History() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/attendance/mine')
      .then((d) => setRows(d))
      .catch((e) => setError(e.message))
  }, [])

  // Collect every absen event across all days, newest day first, then newest event first.
  const events = (rows || [])
    .flatMap((h) => toEvents(h).map((e) => ({ ...e, date: h.date })))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  return (
    <Layout>
      <div className="page">
        <h2 className="page-title">Riwayat Absensi</h2>
        <p className="page-sub">Seluruh riwayat kehadiran Anda, per jenis absen.</p>

        {error && <Alert type="error">{error}</Alert>}

        {!rows ? (
          <Spinner />
        ) : events.length === 0 ? (
          <Empty text="Belum ada riwayat absensi." />
        ) : (
          <Card>
            <ul className="history-list">
              {events.map((e) => (
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
          </Card>
        )}
      </div>
    </Layout>
  )
}
