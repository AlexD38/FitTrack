import {
  eachDayOfInterval,
  format,
  parseISO,
  startOfWeek,
  subDays,
  differenceInCalendarDays,
} from 'date-fns'
import { statsSessionsOnly } from './sessionStatus'

/** Unique ISO dates (yyyy-MM-dd) with at least one past or in-progress session */
export function trainingDates(sessions) {
  return [...new Set(statsSessionsOnly(sessions).map((s) => s.date).filter(Boolean))].sort()
}

export function computeStreaks(sessions, today = new Date()) {
  const dates = trainingDates(sessions)
  if (dates.length === 0) {
    return { current: 0, best: 0, totalDays: 0 }
  }

  const set = new Set(dates)
  const todayStr = format(today, 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')

  let current = 0
  let cursor = set.has(todayStr)
    ? today
    : set.has(yesterdayStr)
      ? subDays(today, 1)
      : null

  if (cursor) {
    while (set.has(format(cursor, 'yyyy-MM-dd'))) {
      current += 1
      cursor = subDays(cursor, 1)
    }
  }

  let best = 0
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = parseISO(dates[i - 1])
    const cur = parseISO(dates[i])
    if (differenceInCalendarDays(cur, prev) === 1) {
      run += 1
    } else {
      best = Math.max(best, run)
      run = 1
    }
  }
  best = Math.max(best, run, current)

  return { current, best, totalDays: dates.length }
}

/** Last `weeks` weeks of heatmap cells (Mon–Sun), intensity by session count that day */
export function buildHeatmap(sessions, weeks = 16, today = new Date()) {
  const counts = {}
  for (const s of sessions ?? []) {
    if (!s.date) continue
    counts[s.date] = (counts[s.date] || 0) + 1
  }

  const end = today
  const start = startOfWeek(subDays(end, (weeks - 1) * 7), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const count = counts[key] || 0
    let level = 0
    if (count >= 1) level = 1
    if (count >= 2) level = 2
    if (count >= 3) level = 3
    return {
      date: key,
      count,
      level,
      dow: d.getDay(), // 0 Sun
    }
  })
}
