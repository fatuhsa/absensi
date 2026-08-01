import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../db.js'
import { withinRadius } from '../geo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

function today() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function nowTime() {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// Save a base64 photo (data:image/...;base64,...) to disk, return public URL.
function savePhoto(base64) {
  const match = base64.match(/^data:(image\/[a-z+]+);base64,(.+)$/)
  if (!match) throw new Error('Foto tidak valid')
  const ext = match[1] === 'image/png' ? 'png' : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(match[2], 'base64'))
  return `/uploads/${filename}`
}

export default function attendanceRoutes(req, res) {
  const { method, path } = req

  // POST /api/attendance/check-in  { lat, lng, photo }
  if (method === 'POST' && path === '/api/attendance/check-in') {
    const employeeId = req.user.employee_id
    if (!employeeId) return res(400, { error: 'Akun tidak terhubung ke karyawan' })

    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId)
    if (!emp) return res(404, { error: 'Karyawan tidak ditemukan' })

    const { lat, lng, photo } = req.body || {}
    if (lat == null || lng == null || !photo) {
      return res(400, { error: 'Lokasi (lat, lng) dan foto wajib diisi' })
    }

    // 1. GPS radius validation (server-side)
    const loc = db.prepare('SELECT * FROM locations WHERE id = 1').get()
    if (!withinRadius(lat, lng, loc.latitude, loc.longitude, loc.radius_meter)) {
      return res(403, { error: 'Di luar area kantor' })
    }

    // 2. Only one check-in per day
    const date = today()
    const existing = db
      .prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
      .get(employeeId, date)
    if (existing) return res(409, { error: 'Sudah check-in hari ini' })

    // 3. Save photo as proof
    let photoUrl
    try {
      photoUrl = savePhoto(photo)
    } catch (e) {
      return res(400, { error: e.message })
    }

    const result = db
      .prepare(
        'INSERT INTO attendance (employee_id, date, check_in_time, check_in_lat, check_in_lng, check_in_photo, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(employeeId, date, nowTime(), lat, lng, photoUrl, 'hadir')

    return res(201, db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid))
  }

  // POST /api/attendance/check-out  { lat, lng, photo }
  if (method === 'POST' && path === '/api/attendance/check-out') {
    const employeeId = req.user.employee_id
    if (!employeeId) return res(400, { error: 'Akun tidak terhubung ke karyawan' })

    const { lat, lng, photo } = req.body || {}
    if (lat == null || lng == null || !photo) {
      return res(400, { error: 'Lokasi (lat, lng) dan foto wajib diisi' })
    }

    const loc = db.prepare('SELECT * FROM locations WHERE id = 1').get()
    if (!withinRadius(lat, lng, loc.latitude, loc.longitude, loc.radius_meter)) {
      return res(403, { error: 'Di luar area kantor' })
    }

    const date = today()
    const existing = db
      .prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
      .get(employeeId, date)
    if (!existing) return res(404, { error: 'Belum check-in hari ini' })
    if (existing.check_out_time) return res(409, { error: 'Sudah check-out hari ini' })

    let photoUrl
    try {
      photoUrl = savePhoto(photo)
    } catch (e) {
      return res(400, { error: e.message })
    }

    db.prepare('UPDATE attendance SET check_out_time = ?, check_out_photo = ? WHERE id = ?')
      .run(nowTime(), photoUrl, existing.id)

    return res(200, db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id))
  }

  // POST /api/attendance/overtime-in  { lat, lng, photo }
  if (method === 'POST' && path === '/api/attendance/overtime-in') {
    const employeeId = req.user.employee_id
    if (!employeeId) return res(400, { error: 'Akun tidak terhubung ke karyawan' })

    const { lat, lng, photo } = req.body || {}
    if (lat == null || lng == null || !photo) {
      return res(400, { error: 'Lokasi (lat, lng) dan foto wajib diisi' })
    }

    const loc = db.prepare('SELECT * FROM locations WHERE id = 1').get()
    if (!withinRadius(lat, lng, loc.latitude, loc.longitude, loc.radius_meter)) {
      return res(403, { error: 'Di luar area kantor' })
    }

    const date = today()
    const existing = db
      .prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
      .get(employeeId, date)
    if (!existing) return res(404, { error: 'Belum check-in hari ini' })
    if (existing.overtime_in_time) return res(409, { error: 'Sudah absen lembur masuk' })

    let photoUrl
    try {
      photoUrl = savePhoto(photo)
    } catch (e) {
      return res(400, { error: e.message })
    }

    db.prepare(
      'UPDATE attendance SET overtime_in_time = ?, overtime_photo = ? WHERE id = ?'
    ).run(nowTime(), photoUrl, existing.id)

    return res(200, db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id))
  }

  // POST /api/attendance/overtime-out  { lat, lng, photo }
  if (method === 'POST' && path === '/api/attendance/overtime-out') {
    const employeeId = req.user.employee_id
    if (!employeeId) return res(400, { error: 'Akun tidak terhubung ke karyawan' })

    const { lat, lng, photo } = req.body || {}
    if (lat == null || lng == null || !photo) {
      return res(400, { error: 'Lokasi (lat, lng) dan foto wajib diisi' })
    }

    const loc = db.prepare('SELECT * FROM locations WHERE id = 1').get()
    if (!withinRadius(lat, lng, loc.latitude, loc.longitude, loc.radius_meter)) {
      return res(403, { error: 'Di luar area kantor' })
    }

    const date = today()
    const existing = db
      .prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
      .get(employeeId, date)
    if (!existing) return res(404, { error: 'Belum absen lembur masuk' })
    if (!existing.overtime_in_time) return res(400, { error: 'Belum absen lembur masuk' })
    if (existing.overtime_out_time) return res(409, { error: 'Sudah absen lembur selesai' })

    let photoUrl
    try {
      photoUrl = savePhoto(photo)
    } catch (e) {
      return res(400, { error: e.message })
    }

    db.prepare('UPDATE attendance SET overtime_out_time = ?, overtime_out_photo = ? WHERE id = ?')
      .run(nowTime(), photoUrl, existing.id)

    return res(200, db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id))
  }

  // GET /api/attendance/mine
  if (method === 'GET' && path === '/api/attendance/mine') {
    const employeeId = req.user.employee_id
    const rows = db
      .prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC, id DESC')
      .all(employeeId)
    return res(200, rows)
  }

  return res(404, { error: 'Not found' })
}
