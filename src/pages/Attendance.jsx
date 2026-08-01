import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getUser } from '../api.js'
import Layout from '../components/Layout.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import Button from '../components/Button.jsx'
import Alert from '../components/Alert.jsx'
import { getPosition } from '../geo.js'
import { LogIn, LogOut, Moon, AlarmClock, MapPin, LocateFixed } from 'lucide-react'

const ACTIONS = {
  'check-in': { label: 'Masuk', icon: LogIn, endpoint: '/attendance/check-in' },
  'check-out': { label: 'Pulang', icon: LogOut, endpoint: '/attendance/check-out' },
  'overtime-in': { label: 'Lembur Masuk', icon: Moon, endpoint: '/attendance/overtime-in' },
  'overtime-out': { label: 'Lembur Selesai', icon: AlarmClock, endpoint: '/attendance/overtime-out' },
}

export default function Attendance() {
  const user = getUser()
  const navigate = useNavigate()
  const [action, setAction] = useState('check-in')
  const [photo, setPhoto] = useState(null)
  const [location, setLocation] = useState(null)
  const [locError, setLocError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const meta = ACTIONS[action]

  const grabLocation = async () => {
    setLocError('')
    try {
      const pos = await getPosition()
      setLocation(pos)
    } catch (e) {
      setLocError(e.message)
      setLocation(null)
    }
  }

  const submit = async () => {
    setError('')
    setSuccess('')
    if (!location) {
      setError('Lokasi belum didapatkan. Tekan tombol lokasi.')
      return
    }
    if (!photo) {
      setError('Foto belum diambil.')
      return
    }
    setLoading(true)
    try {
      await api(meta.endpoint, {
        method: 'POST',
        body: { lat: location.lat, lng: location.lng, photo },
      })
      setSuccess(`Absen ${meta.label} berhasil tersimpan.`)
      setPhoto(null)
      setLocation(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="page">
        <h2 className="page-title">Absensi</h2>
        <p className="page-sub">Halo {user?.username}. Ambil foto dan pastikan berada dalam area kantor.</p>

        {/* Action picker */}
        <div className="segmented">
          {Object.entries(ACTIONS).map(([key, a]) => (
            <button
              key={key}
              className={`segment ${action === key ? 'active' : ''}`}
              onClick={() => {
                setAction(key)
                setError('')
                setSuccess('')
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="att-card">
          <h3 className="att-heading">
            <meta.icon size={18} style={{ verticalAlign: '-3px' }} /> Absen {meta.label}
          </h3>

          <CameraCapture onCapture={setPhoto} />

          <div className="loc-box">
            <div className="loc-info">
              {location ? (
                <>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> Lokasi didapat
                  </strong>
                  <span className="muted">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                </>
              ) : (
                <span className="muted">Lokasi belum didapatkan</span>
              )}
            </div>
            <Button variant="secondary" onClick={grabLocation} disabled={loading}>
              <LocateFixed size={16} /> {location ? 'Perbarui Lokasi' : 'Dapatkan Lokasi'}
            </Button>
          </div>
          {locError && <Alert type="error">{locError}</Alert>}

          <Button
            full
            loading={loading}
            onClick={submit}
            className="att-submit"
          >
            <meta.icon size={16} /> Simpan Absen {meta.label}
          </Button>
        </div>

        <Button variant="ghost" full onClick={() => navigate('/history')}>
          Lihat Riwayat →
        </Button>
      </div>
    </Layout>
  )
}
