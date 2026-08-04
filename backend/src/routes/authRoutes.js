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

  // Registration is intentionally not exposed publicly. Employee login accounts
  // are provisioned by admins via POST /api/employees (admin-only route).
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
