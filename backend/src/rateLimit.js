// In-memory per-IP rate limiter using a sliding-window count.
// State is lost on restart — acceptable for brute-force slowdown on a single node.
// Not suitable for multi-process/multi-node deployments (would need Redis/etc).
//
// Usage:
//   const limiter = rateLimit({ windowMs, max })
//   if (limiter.hit(ip)) return send(res, 429, { error: 'Terlalu banyak permintaan' })

export function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  const hits = new Map() // ip -> array of timestamps
  const maxAge = windowMs

  return {
    hit(ip) {
      const now = Date.now()
      const arr = hits.get(ip) || []
      // Drop timestamps older than the window.
      const fresh = arr.filter((t) => now - t < maxAge)
      fresh.push(now)
      hits.set(ip, fresh)
      return fresh.length > max
    },
    // Allow manual pruning; not strictly required since we filter on read.
    reset(ip) {
      hits.delete(ip)
    },
  }
}
