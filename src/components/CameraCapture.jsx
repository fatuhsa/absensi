import { useEffect, useRef, useState } from 'react'
import Button from './Button.jsx'
import Alert from './Alert.jsx'

// Camera capture that asks for permission, previews the stream, and returns a
// base64 data URL of a single frame on capture().
export default function CameraCapture({ onCapture, onError }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setReady(true)
      } catch (e) {
        setError('Tidak dapat mengakses kamera. Izinkan akses kamera lalu coba lagi.')
        onError?.(e)
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onError])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setPhoto(dataUrl)
    onCapture?.(dataUrl)
  }

  const retake = () => {
    setPhoto(null)
    onCapture?.(null)
  }

  return (
    <div className="camera">
      {error && <Alert type="error">{error}</Alert>}
      <div className="camera-view">
        {photo ? (
          <img src={photo} alt="Hasil foto" className="camera-photo" />
        ) : (
          <video ref={videoRef} playsInline muted className="camera-video" />
        )}
        {!ready && !error && <div className="camera-loading">Menyiapkan kamera...</div>}
      </div>
      <div className="camera-actions">
        {!photo ? (
          <Button full onClick={capture} disabled={!ready}>
            📸 Ambil Foto
          </Button>
        ) : (
          <Button full variant="secondary" onClick={retake}>
            ↺ Ambil Ulang
          </Button>
        )}
      </div>
    </div>
  )
}
