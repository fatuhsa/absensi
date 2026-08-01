import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setSession } from '../api.js'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Alert from '../components/Alert.jsx'
import { MapPin } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/login', { method: 'POST', body: { username, password } })
      setSession(data.token, data.user)
      navigate(data.user.role === 'admin' ? '/' : '/')
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
        <h1 className="login-title">Absensi</h1>
        <p className="login-sub">Masuk untuk melanjutkan</p>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={submit} className="login-form">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <Button type="submit" full loading={loading}>
            Masuk
          </Button>
        </form>
        <p className="login-sub" style={{ marginTop: 16 }}>
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </div>
    </div>
  )
}
