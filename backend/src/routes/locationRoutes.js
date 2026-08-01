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
    db.prepare(
      'UPDATE locations SET name = ?, latitude = ?, longitude = ?, radius_meter = ? WHERE id = 1'
    ).run(name || 'Kantor Pusat', latitude, longitude, radius_meter)
    return res(200, db.prepare('SELECT * FROM locations WHERE id = 1').get())
  }

  return res(404, { error: 'Not found' })
}
