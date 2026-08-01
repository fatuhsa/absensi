import { db } from '../db.js'

export default function reportRoutes(req, res) {
  const { method, path } = req

  // GET /api/report/monthly?year=2026&month=7
  if (method === 'GET' && path === '/api/report/monthly') {
    const year = Number(req.query.year) || new Date().getFullYear()
    const month = Number(req.query.month) || new Date().getMonth() + 1
    const prefix = `${year}-${String(month).padStart(2, '0')}`

    const rows = db
      .prepare(
        `SELECT a.*, e.name AS employee_name, e.position
         FROM attendance a JOIN employees e ON e.id = a.employee_id
         WHERE a.date LIKE ?
         ORDER BY a.date DESC, e.name ASC`
      )
      .all(`${prefix}%`)

    return res(200, { year, month, rows })
  }

  // GET /api/report/employee/:id — full attendance history for one employee
  const empMatch = path.match(/^\/api\/report\/employee\/(\d+)$/)
  if (method === 'GET' && empMatch) {
    const employeeId = Number(empMatch[1])
    const emp = db.prepare('SELECT id, name, position FROM employees WHERE id = ?').get(employeeId)
    if (!emp) return res(404, { error: 'Karyawan tidak ditemukan' })

    const rows = db
      .prepare(
        `SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC, id DESC`
      )
      .all(employeeId)
    return res(200, { employee: emp, rows })
  }

  // GET /api/report/today
  if (method === 'GET' && path === '/api/report/today') {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const date = `${d.getFullYear()}-${m}-${day}`

    const rows = db
      .prepare(
        `SELECT a.*, e.name AS employee_name, e.position
         FROM attendance a JOIN employees e ON e.id = a.employee_id
         WHERE a.date = ? ORDER BY a.check_in_time ASC`
      )
      .all(date)
    return res(200, { date, rows })
  }

  return res(404, { error: 'Not found' })
}
