import { test } from 'node:test'
import assert from 'node:assert/strict'
import { haversine } from './geo.js'

test('haversine: jarak nol di titik yang sama', () => {
  assert.equal(haversine(-6.2, 106.816666, -6.2, 106.816666), 0)
})

test('haversine: jarak ~111 km per 1 derajat lintang', () => {
  // 1 derajat lintang ≈ 111.19 km
  const d = haversine(0, 0, 1, 0)
  assert.ok(d > 110000 && d < 112000, `diharapkan ~111.2 km, dapat ${d}`)
})

test('haversine: jarak simetris (a->b == b->a)', () => {
  const a = haversine(-6.2, 106.8, -6.5, 107.0)
  const b = haversine(-6.5, 107.0, -6.2, 106.8)
  assert.ok(Math.abs(a - b) < 1e-6)
})

test('haversine: jarak yang diketahui Jakarta - Bandung', () => {
  // Jakarta (-6.2, 106.816666) ke Bandung (-6.9175, 107.6191) ≈ 119 km (jarak lurus)
  const d = haversine(-6.2, 106.816666, -6.9175, 107.6191)
  assert.ok(d > 115000 && d < 125000, `diharapkan ~119 km, dapat ${d}`)
})

