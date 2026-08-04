import { db } from '../db.js'

export default function locationRoutes(req, res) {
  const { method, path } = req

  // GET /api/location
  if (method === 'GET' && path === '/api/location') {
    const loc = db.prepare('SELECT * FROM locations WHERE id = 1').get()
    return res(200, loc)
  }

  // PUT /api/location  { name, latitude, longitude, radius_meter }
  if (method === 'PUT' && path === '/api/location') {
    const { name, latitude, longitude, radius_meter } = req.body || {}
    if (latitude == null || longitude == null || radius_meter == null) {
      return res(400, { error: 'latitude, longitude, radius_meter wajib diisi' })
    }
    const lat = Number(latitude)
    const lng = Number(longitude)
    const radius = Number(radius_meter)
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return res(400, { error: 'latitude harus angka antara -90 dan 90' })
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      return res(400, { error: 'longitude harus angka antara -180 dan 180' })
    }
    if (Number.isNaN(radius) || radius <= 0) {
      return res(400, { error: 'radius_meter harus angka lebih dari 0' })
    }
    db.prepare(
      'UPDATE locations SET name = ?, latitude = ?, longitude = ?, radius_meter = ? WHERE id = 1'
    ).run(name || 'Kantor Pusat', lat, lng, radius)
    return res(200, db.prepare('SELECT * FROM locations WHERE id = 1').get())
  }

  return res(404, { error: 'Not found' })
}
