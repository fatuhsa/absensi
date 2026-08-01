import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireAuth, requireRole } from './auth.js'
import authRoutes from './routes/authRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import locationRoutes from './routes/locationRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import reportRoutes from './routes/reportRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const PORT = process.env.PORT || 3001

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// Read JSON body (limit ~20MB to allow base64 photos).
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 20 * 1024 * 1024) {
        reject(new Error('Payload terlalu besar'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try {
        resolve(JSON.parse(data))
      } catch {
        reject(new Error('JSON tidak valid'))
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  })
  res.end(body)
}

// Compose middleware. Each middleware: (req, res, next) => void.
// next() continues to the next middleware / handler.
function chain(...middlewares) {
  return (req, res) => {
    const run = (i) => {
      if (i >= middlewares.length) return
      middlewares[i](req, res, () => run(i + 1))
    }
    run(0)
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  req.path = url.pathname
  req.query = Object.fromEntries(url.searchParams)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    })
    return res.end()
  }

  // Serve uploaded photos
  if (req.path.startsWith('/uploads/')) {
    const file = path.join(UPLOAD_DIR, path.basename(req.path))
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' })
      return fs.createReadStream(file).pipe(res)
    }
    return send(res, 404, { error: 'File tidak ditemukan' })
  }

  // Parse JSON body for API routes
  if (req.path.startsWith('/api/')) {
    try {
      req.body = await readJsonBody(req)
    } catch (e) {
      return send(res, 400, { error: e.message })
    }
  }

  // Route dispatch with auth middleware composition
  if (req.path.startsWith('/api/auth/')) {
    return authRoutes(req, (s, b) => send(res, s, b))
  }

  if (req.path.startsWith('/api/employees')) {
    return chain(
      requireAuth,
      requireRole('admin'),
      (req2, res2, next) => employeeRoutes(req2, (s, b) => send(res2, s, b))
    )(req, res)
  }

  if (req.path.startsWith('/api/location')) {
    return chain(
      requireAuth,
      requireRole('admin'),
      (req2, res2) => locationRoutes(req2, (s, b) => send(res2, s, b))
    )(req, res)
  }

  if (req.path.startsWith('/api/attendance')) {
    return chain(
      requireAuth,
      (req2, res2) => attendanceRoutes(req2, (s, b) => send(res2, s, b))
    )(req, res)
  }

  if (req.path.startsWith('/api/report')) {
    return chain(
      requireAuth,
      requireRole('admin'),
      (req2, res2) => reportRoutes(req2, (s, b) => send(res2, s, b))
    )(req, res)
  }

  return send(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`Backend absensi berjalan di http://localhost:${PORT}`)
})
