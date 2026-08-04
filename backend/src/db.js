import { DatabaseSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'absensi.db')

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    employee_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    position TEXT,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meter REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    check_in_lat REAL,
    check_in_lng REAL,
    check_in_photo TEXT,
    check_out_photo TEXT,
    overtime_in_time TEXT,
    overtime_out_time TEXT,
    overtime_photo TEXT,
    overtime_out_photo TEXT,
    status TEXT NOT NULL DEFAULT 'hadir'
  );
`)

// Migration: add overtime_out_photo if missing (older databases).
const cols = db.prepare(`PRAGMA table_info(attendance)`).all()
if (!cols.some((c) => c.name === 'overtime_out_photo')) {
  db.exec(`ALTER TABLE attendance ADD COLUMN overtime_out_photo TEXT`)
}

function seed() {
  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM users WHERE role = ?').get('admin').c
  if (adminCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run('admin', hash, 'admin')
  }

  // Admin akun untuk sanix
  const sanix = db.prepare('SELECT id FROM users WHERE username = ?').get('sanix')
  if (!sanix) {
    const hash = bcrypt.hashSync('sanixmon', 10)
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run('sanix', hash, 'admin')
  }

  const locCount = db.prepare('SELECT COUNT(*) AS c FROM locations').get().c
  if (locCount === 0) {
    db.prepare(
      'INSERT INTO locations (id, name, latitude, longitude, radius_meter) VALUES (1, ?, ?, ?, ?)'
    ).run('Kantor Pusat', -6.200000, 106.816666, 100)
  }
}

seed()
