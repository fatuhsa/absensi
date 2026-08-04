import jwt from 'jsonwebtoken'

const SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? null : 'absensi-dev-secret-change-me')

if (!SECRET) {
  throw new Error('JWT_SECRET wajib diatur pada environment production')
}

const EXPIRES = '8h'

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, employee_id: user.employee_id },
    SECRET,
    { expiresIn: EXPIRES }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

// Middleware: read Authorization: Bearer <token>, attach req.user.
// On success calls next(); on failure sends 401 and stops.
export function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return send(res, 401, { error: 'Tidak terautentikasi' })
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    return send(res, 401, { error: 'Token tidak valid atau kedaluwarsa' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return send(res, 403, { error: 'Akses ditolak' })
    next()
  }
}
