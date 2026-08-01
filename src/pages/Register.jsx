import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setSession } from '../api.js'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Alert from '../components/Alert.jsx'
import { MapPin } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: { name, password },
      })
      setSession(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><MapPin size={44} /></div>
        <h1 className="login-title">Daftar</h1>
        <p className="login-sub">Buat akun karyawan baru</p>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={submit} className="login-form">
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama (dipakai untuk login)" autoComplete="name" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 karakter" autoComplete="new-password" required />
          <Button type="submit" full loading={loading}>
            Daftar
          </Button>
        </form>
        <p className="login-sub" style={{ marginTop: 16 }}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
