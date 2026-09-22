export const SESSION_STATUS = {
  PAST: 'past',
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function normalizeSessionStatus(status) {
  if (status === SESSION_STATUS.ACTIVE || status === SESSION_STATUS.UPCOMING) return status
  return SESSION_STATUS.PAST
}

/**
 * Resolve past / upcoming from the session date.
 * `#encours` is never auto-changed (only finish / explicit start).
 * Same calendar day: keeps `#avenir` if already scheduled, otherwise `#passée`.
 */
export function resolveSessionStatus(session) {
  const current = normalizeSessionStatus(session?.status)
  if (current === SESSION_STATUS.ACTIVE) return SESSION_STATUS.ACTIVE

  const today = todayIsoDate()
  const date = session?.date
  if (!date) return SESSION_STATUS.PAST
  if (date > today) return SESSION_STATUS.UPCOMING
  if (date < today) return SESSION_STATUS.PAST
  // date === today
  return current === SESSION_STATUS.UPCOMING ? SESSION_STATUS.UPCOMING : SESSION_STATUS.PAST
}

export function withSessionStatus(session) {
  if (!session) return session
  return { ...session, status: resolveSessionStatus(session) }
}

export function isPastSession(session) {
  return resolveSessionStatus(session) === SESSION_STATUS.PAST
}

export function isActiveSession(session) {
  return resolveSessionStatus(session) === SESSION_STATUS.ACTIVE
}

export function isUpcomingSession(session) {
  return resolveSessionStatus(session) === SESSION_STATUS.UPCOMING
}

export function pastSessionsOnly(sessions) {
  return (sessions ?? []).filter(isPastSession)
}

/** Past + in-progress — for dashboard stats (excludes upcoming). */
export function statsSessionsOnly(sessions) {
  return (sessions ?? []).filter((s) => !isUpcomingSession(s))
}

export function findActiveSession(sessions) {
  return (sessions ?? []).find(isActiveSession) ?? null
}

/** active first, then upcoming (date asc), then past (date desc). */
export function sortSessionsByStatus(sessions) {
  const active = []
  const upcoming = []
  const past = []
  for (const s of sessions ?? []) {
    const status = resolveSessionStatus(s)
    if (status === SESSION_STATUS.ACTIVE) active.push(s)
    else if (status === SESSION_STATUS.UPCOMING) upcoming.push(s)
    else past.push(s)
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date))
  past.sort((a, b) => b.date.localeCompare(a.date))
  return [...active, ...upcoming, ...past]
}

export function statusTagKey(status) {
  return `journal.status.${normalizeSessionStatus(status)}`
}
