// Load backend/.env (JWT_SECRET etc.) before any module reads process.env.
import './loadEnv.js'

// Force seluruh backend memakai waktu WIB (UTC+7) untuk tanggal & jam absensi.
process.env.TZ = 'Asia/Jakarta'

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyToken } from './auth.js'
import { requireAuth, requireRole } from './auth.js'
import { rateLimit } from './rateLimit.js'
import authRoutes from './routes/authRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import locationRoutes from './routes/locationRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import reportRoutes from './routes/reportRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const DIST_DIR = path.join(__dirname, '..', '..', 'dist')
const PORT = Number(process.env.PORT) || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// CORS allowlist from CORS_ORIGIN (comma-separated). In production this MUST be
// set to the exact origin(s) that should be allowed. Empty = deny cross-origin.
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

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

function corsHeaders(origin) {
  const allow = CORS_ORIGINS.includes(origin) ? origin : null
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    Vary: 'Origin',
  }
  if (allow) {
    headers['Access-Control-Allow-Origin'] = allow
  }
  return headers
}

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), camera=(self)',
  }
}

function send(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...securityHeaders(),
    ...extraHeaders,
  })
  res.end(body)
}

// Structured request log — one line per request, no secrets/stack traces.
function logRequest(method, pathname, status, startedAt, tokenPresent) {
  const ms = Date.now() - startedAt
  const ts = new Date(startedAt).toISOString()
  console.log(
    JSON.stringify({
      t: ts,
      method,
      path: pathname,
      status,
      ms,
      auth: tokenPresent ? 'yes' : 'no',
    })
  )
}

// Login brute-force protection: max 10 attempts / minute per IP.
const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 })

// MIME map for static assets.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
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

// Authenticate a Bearer token from the Authorization header. Returns the
// decoded user on success, null otherwise. Unlike requireAuth it does not send
// a response — used for optional auth on /uploads/.
function optionalUser(req) {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now()
  const url = new URL(req.url, `http://${req.headers.host}`)
  req.path = url.pathname
  req.query = Object.fromEntries(url.searchParams)
  const origin = req.headers.origin || ''
  const cors = corsHeaders(origin)
  const tokenPresent = !!(req.headers['authorization'] || '').startsWith('Bearer ')

  // Wrap res.end to log every response once.
  const origEnd = res.end.bind(res)
  res.end = (...args) => {
    logRequest(req.method, req.path, res.statusCode, startedAt, tokenPresent)
    return origEnd(...args)
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...securityHeaders(), ...cors })
    return res.end()
  }

  // Health check — no auth, returns 200 + JSON.
  if (req.method === 'GET' && req.path === '/api/health') {
    return send(res, 200, { status: 'ok', time: new Date().toISOString() }, cors)
  }

  // Serve uploaded photos — JWT-gated so only authenticated users can view
  // attendance proof photos. Path is constrained to basename; no traversal.
  if (req.path.startsWith('/uploads/')) {
    const user = optionalUser(req)
    if (!user) return send(res, 401, { error: 'Tidak terautentikasi' }, cors)

    const file = path.join(UPLOAD_DIR, path.basename(req.path))
    if (fs.existsSync(file)) {
      const ext = path.extname(file).toLowerCase()
      const contentType = MIME[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': contentType, ...securityHeaders() })
      return fs.createReadStream(file).pipe(res)
    }
    return send(res, 404, { error: 'File tidak ditemukan' }, cors)
  }

  // Parse JSON body for API routes
  if (req.path.startsWith('/api/')) {
    // Rate-limit login attempts before parsing body.
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket.remoteAddress
      if (loginLimiter.hit(ip)) {
        return send(res, 429, { error: 'Terlalu banyak percobaan login, coba lagi nanti' }, cors)
      }
    }
    try {
      req.body = await readJsonBody(req)
    } catch (e) {
      return send(res, 400, { error: e.message }, cors)
    }
  }

  // Route dispatch with auth middleware composition
  if (req.path.startsWith('/api/auth/')) {
    return authRoutes(req, (s, b) => send(res, s, b, cors))
  }

  if (req.path.startsWith('/api/employees')) {
    return chain(
      requireAuth,
      requireRole('admin'),
      (req2, res2) => employeeRoutes(req2, (s, b) => send(res2, s, b, cors))
    )(req, res)
  }

  if (req.path.startsWith('/api/location')) {
    return chain(
      requireAuth,
      requireRole('admin'),
      (req2, res2) => locationRoutes(req2, (s, b) => send(res2, s, b, cors))
    )(req, res)
  }

  if (req.path.startsWith('/api/attendance')) {
    return chain(
      requireAuth,
      (req2, res2) => attendanceRoutes(req2, (s, b) => send(res2, s, b, cors))
    )(req, res)
  }

  if (req.path.startsWith('/api/report')) {
    return chain(
      requireAuth,
      requireRole('admin'),
      (req2, res2) => reportRoutes(req2, (s, b) => send(res2, s, b, cors))
    )(req, res)
  }

  // In production, serve the built frontend (Vite dist) with SPA fallback.
  if (IS_PROD && fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, req.path === '/' ? 'index.html' : req.path)
    if (!filePath.startsWith(DIST_DIR)) {
      return send(res, 403, { error: 'Forbidden' })
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      return fs.createReadStream(filePath).pipe(res)
    }
    // SPA fallback for client-side routing.
    const indexHtml = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': MIME['.html'] })
      return fs.createReadStream(indexHtml).pipe(res)
    }
  }

  return send(res, 404, { error: 'Not found' }, cors)
})

server.listen(PORT, () => {
  console.log(
    JSON.stringify({
      t: new Date().toISOString(),
      msg: 'server-started',
      port: PORT,
      env: IS_PROD ? 'production' : 'development',
      cors: CORS_ORIGINS.length ? CORS_ORIGINS : 'none',
      staticDist: IS_PROD && fs.existsSync(DIST_DIR),
    })
  )
})
