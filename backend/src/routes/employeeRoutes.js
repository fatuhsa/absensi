import bcrypt from 'bcryptjs'
import { db } from '../db.js'

export default function employeeRoutes(req, res) {
  const { method, path } = req

  // GET /api/employees
  if (method === 'GET' && path === '/api/employees') {
    const rows = db.prepare('SELECT * FROM employees ORDER BY name').all()
    return res(200, rows)
  }

  // POST /api/employees  { name, email, position, username, password }
  if (method === 'POST' && path === '/api/employees') {
    const { name, email, position, username, password } = req.body || {}
    if (!name || !email || !username || !password) {
      return res(400, { error: 'name, email, username, password wajib diisi' })
    }

    const existing = db.prepare('SELECT id FROM employees WHERE email = ?').get(email)
    if (existing) return res(409, { error: 'Email sudah terdaftar' })

    const empResult = db
      .prepare('INSERT INTO employees (name, email, position) VALUES (?, ?, ?)')
      .run(name, email, position || null)
    const employeeId = empResult.lastInsertRowid

    const hash = bcrypt.hashSync(password, 10)
    db.prepare(
      'INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)'
    ).run(username, hash, 'employee', employeeId)

    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId)
    return res(201, emp)
  }

  // PUT /api/employees/:id  { name, email, position, username?, password? }
  const putMatch = path.match(/^\/api\/employees\/(\d+)$/)
  if (method === 'PUT' && putMatch) {
    const id = putMatch[1]
    const { name, email, position, username, password } = req.body || {}
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    if (!emp) return res(404, { error: 'Karyawan tidak ditemukan' })

    db.prepare('UPDATE employees SET name = ?, email = ?, position = ? WHERE id = ?')
      .run(name ?? emp.name, email ?? emp.email, position ?? emp.position, id)

    // Update akun login jika username/password diberikan
    const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(id)
    if (user) {
      if (username) {
        db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, user.id)
      }
      if (password) {
        const hash = bcrypt.hashSync(password, 10)
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id)
      }
    }

    return res(200, db.prepare('SELECT * FROM employees WHERE id = ?').get(id))
  }

  // DELETE /api/employees/:id
  const delMatch = path.match(/^\/api\/employees\/(\d+)$/)
  if (method === 'DELETE' && delMatch) {
    const id = delMatch[1]
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    if (!emp) return res(404, { error: 'Karyawan tidak ditemukan' })

    db.prepare('DELETE FROM users WHERE employee_id = ?').run(id)
    db.prepare('DELETE FROM employees WHERE id = ?').run(id)
    return res(200, { ok: true })
  }

  return res(404, { error: 'Not found' })
}
