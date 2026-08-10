import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subWeeks,
  parseISO,
  isWithinInterval,
  subDays,
} from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export function sessionVolume(session) {
  if (!session?.exercises) return 0
  return session.exercises.reduce(
    (total, ex) =>
      total +
      (ex.sets ?? []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0),
    0,
  )
}

export function sessionsThisMonth(sessions) {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  return sessions.filter((s) => {
    const d = parseISO(s.date)
    return isWithinInterval(d, { start, end })
  }).length
}

export function weeklyVolume(sessions, weeks = 8) {
  const localeMap = { fr, en: enUS }
  const result = []
  const now = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const vol = sessions
      .filter((s) => {
        const d = parseISO(s.date)
        return isWithinInterval(d, { start: weekStart, end: weekEnd })
      })
      .reduce((sum, s) => sum + sessionVolume(s), 0)

    result.push({
      week: format(weekStart, 'd MMM', { locale: localeMap.fr }),
      volume: vol,
    })
  }
  return result
}

export function getAllExerciseNames(sessions) {
  const names = new Set()
  for (const s of sessions) {
    for (const ex of s.exercises ?? []) {
      if (ex.name?.trim()) names.add(ex.name.trim())
    }
  }
  return [...names].sort()
}

export function exerciseProgressSeries(sessions, exerciseName) {
  if (!exerciseName) return []
  const points = []

  for (const s of sessions) {
    const ex = (s.exercises ?? []).find(
      (e) => e.name?.trim().toLowerCase() === exerciseName.toLowerCase(),
    )
    if (!ex || !ex.sets?.length) continue
    const maxWeight = Math.max(...ex.sets.map((set) => set.weight || 0))
    if (maxWeight > 0) {
      points.push({ date: s.date, weight: maxWeight })
    }
  }

  return points.sort((a, b) => a.date.localeCompare(b.date))
}

export function topExerciseProgress(sessions, days = 30) {
  const cutoff = subDays(new Date(), days)
  const names = getAllExerciseNames(sessions)
  let best = null

  for (const name of names) {
    const series = exerciseProgressSeries(sessions, name)
    const recent = series.filter((p) => parseISO(p.date) >= cutoff)
    const older = series.filter((p) => parseISO(p.date) < cutoff)
    if (recent.length === 0 || older.length === 0) continue

    const recentMax = Math.max(...recent.map((p) => p.weight))
    const olderMax = Math.max(...older.map((p) => p.weight))
    const delta = recentMax - olderMax

    if (!best || delta > best.delta) {
      best = { name, delta, recentMax }
    }
  }

  return best
}

export function muscleDistribution(sessions) {
  const counts = {}
  for (const s of sessions) {
    for (const m of s.muscles ?? []) {
      counts[m] = (counts[m] || 0) + 1
    }
  }
  return Object.entries(counts).map(([muscle, count]) => ({ muscle, count }))
}

export function weekVolumeTotal(sessions) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  return sessions
    .filter((s) => {
      const d = parseISO(s.date)
      return isWithinInterval(d, { start: weekStart, end: weekEnd })
    })
    .reduce((sum, s) => sum + sessionVolume(s), 0)
}

export function weightSeries(entries, days = 90) {
  const cutoff = subDays(new Date(), days)
  return [...entries]
    .filter((e) => parseISO(e.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, weight: e.weight }))
}

export function weightDelta(entries) {
  if (entries.length < 2) return { sinceStart: 0, sinceLast: 0 }
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0].weight
  const last = sorted[sorted.length - 1].weight
  const prev = sorted[sorted.length - 2].weight
  return {
    sinceStart: last - first,
    sinceLast: last - prev,
    current: last,
  }
}

export function convertWeight(weight, from, to) {
  if (from === to) return weight
  if (from === 'kg' && to === 'lb') return weight * 2.20462
  if (from === 'lb' && to === 'kg') return weight / 2.20462
  return weight
}
