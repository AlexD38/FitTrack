import { addWeeks, format, parseISO, startOfWeek, subDays, subWeeks } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { statsSessionsOnly } from './sessionStatus'
import { exerciseKey, isBodyweightExercise } from './exercises'
import { sessionVolume } from './stats'

const WEEK = { weekStartsOn: 1 }

function weekStartOf(date) {
  return startOfWeek(date, WEEK)
}

/** Volume and session count per week, oldest first, ending with the current week. */
export function weeklyBuckets(sessions, weeks = 12, locale = 'fr') {
  const dateLocale = locale === 'en' ? enUS : fr
  const first = weekStartOf(subWeeks(new Date(), weeks - 1))
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addWeeks(first, i)
    return { key: start.getTime(), label: format(start, 'd MMM', { locale: dateLocale }), volume: 0, count: 0 }
  })
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  for (const s of statsSessionsOnly(sessions)) {
    if (!s.date) continue
    const bucket = byKey.get(weekStartOf(parseISO(s.date)).getTime())
    if (!bucket) continue
    bucket.volume += sessionVolume(s)
    bucket.count += 1
  }
  return buckets
}

/** Relative change in %, or null when there is nothing to compare against. */
export function percentChange(current, previous) {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Best performance per session for one exercise: the heaviest set, or — for bodyweight work with
 * no added load — the most reps.
 */
function exercisePoints(sessions) {
  const byExercise = new Map()
  for (const s of statsSessionsOnly(sessions)) {
    if (!s.date) continue
    for (const ex of s.exercises ?? []) {
      const name = ex.name?.trim()
      if (!name) continue
      const sets = (ex.sets ?? []).map((set) => ({
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
      }))
      if (!sets.some((set) => set.weight > 0 || set.reps > 0)) continue
      const key = exerciseKey(name)
      if (!byExercise.has(key)) byExercise.set(key, { key, name, bodyweight: false, points: [], lastDate: '' })
      const entry = byExercise.get(key)
      if (s.date >= entry.lastDate) {
        entry.lastDate = s.date
        entry.name = name
        entry.bodyweight = isBodyweightExercise(ex)
      }
      entry.points.push({
        date: s.date,
        weight: Math.max(...sets.map((set) => set.weight)),
        reps: Math.max(...sets.map((set) => set.reps)),
      })
    }
  }

  for (const entry of byExercise.values()) {
    entry.metric = entry.points.some((p) => p.weight > 0) ? 'weight' : 'reps'
    const byDate = new Map()
    for (const p of entry.points) {
      const value = entry.metric === 'weight' ? p.weight : p.reps
      if (entry.metric === 'weight' && value <= 0) continue
      byDate.set(p.date, Math.max(byDate.get(p.date) ?? 0, value))
    }
    entry.series = [...byDate.entries()]
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
  return [...byExercise.values()].filter((e) => e.series.length > 0)
}

/**
 * Main exercises over the last `days`: most trained first, with their best-set series and the
 * change from the first to the latest session in that window.
 */
export function exerciseTrends(sessions, { days = 90, limit = 5 } = {}) {
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd')
  return exercisePoints(sessions)
    .map((e) => {
      const series = e.series.filter((p) => p.date >= cutoff)
      if (!series.length) return null
      const first = series[0].value
      const current = series[series.length - 1].value
      return {
        key: e.key,
        name: e.name,
        metric: e.metric,
        bodyweight: e.bodyweight,
        series,
        current,
        best: Math.max(...series.map((p) => p.value)),
        delta: current - first,
        pct: percentChange(current, first),
        lastDate: e.lastDate,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.series.length - a.series.length || b.lastDate.localeCompare(a.lastDate))
    .slice(0, limit)
}

/** Sessions in the last `days` that beat every earlier best on an exercise. */
export function recentRecords(sessions, days = 30) {
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd')
  let count = 0
  for (const e of exercisePoints(sessions)) {
    let best = null
    for (const p of e.series) {
      if (best != null && p.value > best && p.date >= cutoff) count += 1
      best = best == null ? p.value : Math.max(best, p.value)
    }
  }
  return count
}
