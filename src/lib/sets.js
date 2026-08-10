/** Default set: 0 kg = bodyweight allowed. */
export function emptySet(overrides = {}) {
  return { weight: 0, reps: '', rpe: '', ...overrides }
}

/**
 * Keep a set if reps are filled. Empty weight → 0 (bodyweight).
 * Returns null if the set should be dropped.
 */
export function normalizeSetForSave(s) {
  if (s.reps === '' || s.reps == null) return null
  const reps = Number(s.reps)
  if (Number.isNaN(reps)) return null

  const rawW = s.weight
  const weight =
    rawW === '' || rawW == null || Number.isNaN(Number(rawW)) ? 0 : Number(rawW)

  const out = { weight, reps }
  if (s.rpe !== '' && s.rpe != null && !Number.isNaN(Number(s.rpe))) {
    out.rpe = Number(s.rpe)
  }
  return out
}

export function normalizeSetsForSave(sets) {
  return (sets ?? []).map(normalizeSetForSave).filter(Boolean)
}
