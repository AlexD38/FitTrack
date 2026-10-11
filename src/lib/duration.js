/** Format seconds as `12:34` or `1h 02:03`. */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function durationBetween(startedAt, endedAt = Date.now()) {
  if (!startedAt) return 0
  const start = typeof startedAt === 'string' ? Date.parse(startedAt) : Number(startedAt)
  const end = typeof endedAt === 'string' ? Date.parse(endedAt) : Number(endedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return Math.floor((end - start) / 1000)
}
