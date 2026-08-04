import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, BCRYPT_ROUNDS } from '../db.js'

export default function employeeRoutes(req, res) {
  const { method, path: reqPath } = req
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

  // GET /api/employees
  if (method === 'GET' && reqPath === '/api/employees') {
    const rows = db
      .prepare(
        `SELECT e.*, u.username
         FROM employees e
         LEFT JOIN users u ON u.employee_id = e.id
         ORDER BY e.name`
      )
      .all()
    return res(200, rows)
  }

  // POST /api/employees  { name, email, position, username, password }
  if (method === 'POST' && reqPath === '/api/employees') {
    const { name, email, position, username, password } = req.body || {}
    if (!name || !email || !username || !password) {
      return res(400, { error: 'name, email, username, password wajib diisi' })
    }
    if (password.length < 6) {
      return res(400, { error: 'Password minimal 6 karakter' })
    }

    const existing = db.prepare('SELECT id FROM employees WHERE email = ?').get(email)
    if (existing) return res(409, { error: 'Email sudah terdaftar' })

    const usernameTaken = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (usernameTaken) return res(409, { error: 'Username sudah dipakai' })

    db.exec('BEGIN')
    try {
      const empResult = db
        .prepare('INSERT INTO employees (name, email, position) VALUES (?, ?, ?)')
        .run(name, email, position || null)
      const employeeId = empResult.lastInsertRowid

      const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
      db.prepare(
        'INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)'
      ).run(username, hash, 'employee', employeeId)

      db.exec('COMMIT')
      const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId)
      return res(201, { ...emp, username })
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }

  // PUT /api/employees/:id  { name, email, position, username?, password? }
  const putMatch = reqPath.match(/^\/api\/employees\/(\d+)$/)
  if (method === 'PUT' && putMatch) {
    const id = putMatch[1]
    const { name, email, position, username, password } = req.body || {}
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    if (!emp) return res(404, { error: 'Karyawan tidak ditemukan' })

    if (password !== undefined && password !== '' && password.length < 6) {
      return res(400, { error: 'Password minimal 6 karakter' })
    }

    if (email && email !== emp.email) {
      const taken = db.prepare('SELECT id FROM employees WHERE email = ? AND id != ?').get(email, id)
      if (taken) return res(409, { error: 'Email sudah terdaftar' })
    }

    db.prepare('UPDATE employees SET name = ?, email = ?, position = ? WHERE id = ?')
      .run(name ?? emp.name, email ?? emp.email, position ?? emp.position, id)

    // Update akun login jika username/password diberikan
    const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(id)
    if (user) {
      if (username && username !== user.username) {
        const taken = db
          .prepare('SELECT id FROM users WHERE username = ? AND id != ?')
          .get(username, user.id)
        if (taken) return res(409, { error: 'Username sudah dipakai' })
        db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, user.id)
      }
      if (password) {
        const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id)
      }
    }

    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    const updatedUser = db.prepare('SELECT username FROM users WHERE employee_id = ?').get(id)
    return res(200, { ...updated, username: updatedUser?.username || null })
  }

  // DELETE /api/employees/:id
  const delMatch = reqPath.match(/^\/api\/employees\/(\d+)$/)
  if (method === 'DELETE' && delMatch) {
    const id = delMatch[1]
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    if (!emp) return res(404, { error: 'Karyawan tidak ditemukan' })

    const photoColumns = [
      'check_in_photo',
      'check_out_photo',
      'overtime_photo',
      'overtime_out_photo',
    ]

    db.exec('BEGIN')
    try {
      const attRows = db
        .prepare(`SELECT ${photoColumns.join(', ')} FROM attendance WHERE employee_id = ?`)
        .all(id)

      db.prepare('DELETE FROM attendance WHERE employee_id = ?').run(id)
      db.prepare('DELETE FROM users WHERE employee_id = ?').run(id)
      db.prepare('DELETE FROM employees WHERE id = ?').run(id)
      db.exec('COMMIT')

      // Clean up photo files after the DB transaction commits.
      for (const row of attRows) {
        for (const col of photoColumns) {
          const photoUrl = row[col]
          if (photoUrl && photoUrl.startsWith('/uploads/')) {
            const filename = path.basename(photoUrl)
            try {
              fs.unlinkSync(path.join(UPLOAD_DIR, filename))
            } catch {
              // File may already be gone — ignore.
            }
          }
        }
      }
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
    return res(200, { ok: true })
  }

  return res(404, { error: 'Not found' })
}
