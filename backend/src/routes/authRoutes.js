import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { signToken } from '../auth.js'

export default function authRoutes(req, res) {
  if (req.method === 'POST' && req.path === '/api/auth/login') {
    const { username, password } = req.body || {}
    if (!username || !password) return res(400, { error: 'Username dan password wajib diisi' })

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res(401, { error: 'Username atau password salah' })
    }

    return res(200, { token: signToken(user), user: publicUser(user) })
  }

  // POST /api/auth/register  { name, password } — name dipakai sebagai username login
  if (req.method === 'POST' && req.path === '/api/auth/register') {
    const { name, password } = req.body || {}
    if (!name || !password) {
      return res(400, { error: 'Nama dan password wajib diisi' })
    }
    if (password.length < 6) {
      return res(400, { error: 'Password minimal 6 karakter' })
    }
    if (db.prepare('SELECT id FROM users WHERE username = ?').get(name)) {
      return res(409, { error: 'Nama sudah terdaftar' })
    }

    const hash = bcrypt.hashSync(password, 10)
    const email = `${name}@self-registered`
    const emp = db
      .prepare('INSERT INTO employees (name, email, position, status) VALUES (?, ?, ?, ?)')
      .run(name, email, null, 'active')
    const user = db
      .prepare('INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)')
      .run(name, hash, 'employee', emp.lastInsertRowid)
    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(user.lastInsertRowid)

    return res(201, { token: signToken(created), user: publicUser(created) })
  }

  return res(404, { error: 'Not found' })
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    employee_id: user.employee_id,
  }
}
