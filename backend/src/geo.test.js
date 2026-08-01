import { test } from 'node:test'
import assert from 'node:assert/strict'
import { haversine, withinRadius } from './geo.js'

test('haversine: jarak nol di titik yang sama', () => {
  assert.equal(haversine(-6.2, 106.816666, -6.2, 106.816666), 0)
})

test('haversine: jarak ~111 km per 1 derajat lintang (khatulistiwa)', () => {
  const d = haversine(0, 0, 1, 0)
  assert.ok(d > 110000 && d < 112000, `diharapkan ~111.2 km, dapat ${d}`)
})

test('haversine: jarak simetris', () => {
  const a = haversine(-6.2, 106.8, -6.5, 107.0)
  const b = haversine(-6.5, 107.0, -6.2, 106.8)
  assert.ok(Math.abs(a - b) < 1e-6)
})

test('haversine: jarak yang diketahui Jakarta - Bandung', () => {
  // Jakarta (-6.2, 106.816666) ke Bandung (-6.9175, 107.6191) ≈ 119 km (jarak lurus)
  const d = haversine(-6.2, 106.816666, -6.9175, 107.6191)
  assert.ok(d > 115000 && d < 125000, `diharapkan ~119 km, dapat ${d}`)
})

test('withinRadius: geofencing menolak titik di luar radius', () => {
  // Kantor (-6.2, 106.816666) radius 100m; titik jauh -> false
  assert.equal(withinRadius(-6.9175, 107.6191, -6.2, 106.816666, 100), false)
})

test('withinRadius: geofencing menerima titik di dalam radius', () => {
  // Titik sama dengan pusat -> true (jarak 0 <= radius)
  assert.equal(withinRadius(-6.2, 106.816666, -6.2, 106.816666, 100), true)
})

test('withinRadius: tepi radius (jarak == radius) diterima', () => {
  assert.equal(withinRadius(-6.2, 106.816666, -6.2, 106.816666, 0), true)
})
