import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { getPosition } from '../geo.js'
import Layout from '../components/Layout.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Alert from '../components/Alert.jsx'
import Spinner from '../components/Spinner.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { LocateFixed } from 'lucide-react'

export default function Settings() {
  const [loc, setLoc] = useState(null)
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radius_meter: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api('/location')
      .then((d) => {
        setLoc(d)
        setForm({
          name: d.name,
          latitude: String(d.latitude),
          longitude: String(d.longitude),
          radius_meter: String(d.radius_meter),
        })
      })
      .catch((e) => setError(e.message))
  }, [])

  const onMapChange = ({ lat, lng }) => {
    setForm((f) => ({
      ...f,
      latitude: String(Number(lat.toFixed(6))),
      longitude: String(Number(lng.toFixed(6))),
    }))
  }

  const useMyLocation = async () => {
    setError('')
    setSuccess('')
    try {
      const pos = await getPosition()
      setForm((f) => ({
        ...f,
        latitude: String(Number(pos.lat.toFixed(6))),
        longitude: String(Number(pos.lng.toFixed(6))),
      }))
    } catch (e) {
      setError(e.message)
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await api('/location', {
        method: 'PUT',
        body: {
          name: form.name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          radius_meter: parseFloat(form.radius_meter),
        },
      })
      setSuccess('Lokasi kantor berhasil diperbarui.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loc) return <Layout><Spinner text="Memuat lokasi..." /></Layout>

  return (
    <Layout>
      <div className="page">
        <h2 className="page-title">Lokasi Kantor</h2>
        <p className="page-sub">
          Karyawan hanya bisa absen dalam radius ini dari titik lokasi.
        </p>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Card title="Konfigurasi Geofencing">
          <form onSubmit={save} className="form-stack">
            <LocationPicker
              center={{ lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }}
              radius={parseFloat(form.radius_meter)}
              onChange={onMapChange}
            />
            <p className="loc-hint">
              Geser marker atau klik peta untuk mengubah titik lokasi. Lingkaran menunjukkan radius
              geofencing.
            </p>
            <Input
              label="Nama Lokasi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="row-2">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                required
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                required
              />
            </div>
            <Button variant="secondary" type="button" onClick={useMyLocation} full>
              <LocateFixed size={16} /> Gunakan Lokasi Saya
            </Button>
            <Input
              label="Radius (meter)"
              type="number"
              min="1"
              value={form.radius_meter}
              onChange={(e) => setForm({ ...form, radius_meter: e.target.value })}
              hint="mis. 100 = radius 100 meter"
              required
            />
            <Button type="submit" full loading={saving}>
              Simpan Konfigurasi
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
