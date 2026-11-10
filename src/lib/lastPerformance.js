import { isPastSession } from './sessionStatus'

const FIELDS = ['weight', 'reps']

function normalizeName(name) {
  return (name ?? '').trim().toLocaleLowerCase()
}

function byMostRecent(a, b) {
  const byDate = (b.date ?? '').localeCompare(a.date ?? '')
  if (byDate !== 0) return byDate
  return (b.endedAt ?? b.startedAt ?? '').localeCompare(a.endedAt ?? a.startedAt ?? '')
}

function isLogged(set) {
  return Number(set.weight) > 0 || Number(set.reps) > 0
}

/** Sets of `name` in the most recent finished session that logged it, or null. */
export function lastExerciseSets(sessions, name) {
  const key = normalizeName(name)
  if (!key) return null
  const past = (sessions ?? []).filter(isPastSession).sort(byMostRecent)
  for (const session of past) {
    const ex = (session.exercises ?? []).find(
      (e) => normalizeName(e.name) === key && (e.sets ?? []).some(isLogged),
    )
    if (ex) return ex.sets
  }
  return null
}

/** Same set index from last time; extra sets reuse the last set's value. */
function valueAt(prevSets, idx, field) {
  const s = prevSets[Math.min(idx, prevSets.length - 1)]
  return Number(s?.[field]) || 0
}

/**
 * Prefill each set's weight and reps from the last session with the same exercise.
 * `onlyEmpty` keeps values the user already set (e.g. a planned session).
 */
export function withLastPerformance(exercises, sessions, { onlyEmpty = false } = {}) {
  return (exercises ?? []).map((ex) => {
    const prev = lastExerciseSets(sessions, ex.name)
    if (!prev) return ex
    return {
      ...ex,
      sets: (ex.sets ?? []).map((s, i) => {
        if (s.done) return s
        let next = s
        for (const field of FIELDS) {
          if (onlyEmpty && Number(s[field]) > 0) continue
          const value = valueAt(prev, i, field)
          if (value > 0) next = { ...next, [field]: value }
        }
        return next
      }),
    }
  })
}
