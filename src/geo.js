// Get current GPS position via the browser. Resolves { lat, lng }.
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser ini'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const map = {
          1: 'Izin lokasi ditolak',
          2: 'Lokasi tidak tersedia',
          3: 'Waktu permintaan lokasi habis',
        }
        reject(new Error(map[err.code] || 'Gagal mendapatkan lokasi'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

// Haversine distance in meters (client-side mirror of backend for instant feedback).
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
