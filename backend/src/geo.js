// Haversine distance in meters between two lat/lng points.
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Returns true if point (lat,lng) is within radius_meter of center (clat,clng).
export function withinRadius(lat, lng, clat, clng, radiusMeter) {
  return haversine(lat, lng, clat, clng) <= radiusMeter
}
