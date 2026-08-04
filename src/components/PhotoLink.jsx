import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { getToken } from '../api.js'

// Renders a link that opens an uploaded attendance proof photo. Because
// /uploads/ is JWT-gated on the server, we cannot use a plain href — we fetch
// the photo with the Bearer token, create an object URL, and open it in a new
// tab. Falls back gracefully if the token is missing or the fetch fails.
export default function PhotoLink({ photo, label }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!photo) return
    const token = getToken()
    if (!token) {
      setError(true)
      return
    }
    let objectUrl
    let cancelled = false
    fetch(photo, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photo])

  const open = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={open}
      className="photo-link"
      aria-label={label}
      disabled={!url && !error}
      title={error ? 'Foto tidak dapat dimuat' : label}
      style={error ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
    >
      <Camera size={18} />
    </button>
  )
}
