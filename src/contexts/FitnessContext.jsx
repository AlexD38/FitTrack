/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { DEFAULT_PALETTE, isValidPalette } from '../lib/palettes'
import {
  SESSION_STATUS,
  findActiveSession,
  sortSessionsByStatus,
  withSessionStatus,
} from '../lib/sessionStatus'

export const STORAGE_KEY = 'fitness-v1'

const DEFAULT_SETTINGS = {
  locale: 'fr',
  theme: 'dark',
  palette: DEFAULT_PALETTE,
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  timerSound: true,
  timerVibrate: true,
  weightGoal: null,
  exerciseGoals: {},
}

const EMPTY_STATE = {
  sessions: [],
  weightEntries: [],
  settings: DEFAULT_SETTINGS,
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeState(parsed) {
  if (!parsed) return null
  const settings = { ...DEFAULT_SETTINGS, ...parsed.settings }
  if (!isValidPalette(settings.palette)) settings.palette = DEFAULT_PALETTE
  if (settings.weightGoal != null) settings.weightGoal = Number(settings.weightGoal) || null
  if (!settings.exerciseGoals || typeof settings.exerciseGoals !== 'object') {
    settings.exerciseGoals = {}
  }
  const sessions = Array.isArray(parsed.sessions)
    ? parsed.sessions.map((s) => withSessionStatus(s))
    : []
  return {
    sessions,
    weightEntries: Array.isArray(parsed.weightEntries) ? parsed.weightEntries : [],
    settings,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    return normalizeState(JSON.parse(raw)) ?? EMPTY_STATE
  } catch {
    return EMPTY_STATE
  }
}

function cloneSessionPayload(session, dateOverride) {
  return {
    date: dateOverride ?? new Date().toISOString().slice(0, 10),
    muscles: [...(session.muscles ?? [])],
    notes: session.notes ?? '',
    status: session.status ?? SESSION_STATUS.PAST,
    exercises: (session.exercises ?? []).map((ex) => ({
      name: ex.name,
      sets: (ex.sets ?? []).map((s) => ({
        weight: s.weight,
        reps: s.reps,
        ...(s.rpe != null ? { rpe: s.rpe } : {}),
      })),
    })),
  }
}

const FitnessContext = createContext(null)

export function FitnessProvider({ children }) {
  const [state, setState] = useState(loadState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const addSession = useCallback((session) => {
    const id = uid('session')
    const next = withSessionStatus({
      ...session,
      status: session.status ?? SESSION_STATUS.PAST,
      id,
    })
    setState((prev) => ({
      ...prev,
      sessions: [next, ...prev.sessions],
    }))
    return id
  }, [])

  const updateSession = useCallback((id, updates) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === id ? withSessionStatus({ ...s, ...updates }) : s,
      ),
    }))
  }, [])

  const deleteSession = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }))
  }, [])

  /**
   * Atomically open a live workout:
   * - resume the existing #encours when replaceActive is false
   * - promote an upcoming session in place when existingId is set
   * - otherwise create one new active session
   * Abandoned unfinished #encours are removed (not archived) when replaced,
   * so Relancer / new starts don't leave ghost past duplicates.
   */
  const beginLiveSession = useCallback((payload, { existingId, replaceActive = false } = {}) => {
    const startedAt = payload.startedAt ?? new Date().toISOString()
    const active = findActiveSession(stateRef.current.sessions)

    if (active && !replaceActive && (!existingId || active.id !== existingId)) {
      return active.id
    }

    const dropActiveId =
      active && replaceActive && active.id !== existingId ? active.id : null

    if (existingId) {
      setState((prev) => {
        let sessions = prev.sessions
        if (dropActiveId) sessions = sessions.filter((s) => s.id !== dropActiveId)
        const exists = sessions.some((s) => s.id === existingId)
        if (!exists) return prev
        return {
          ...prev,
          sessions: sessions.map((s) =>
            s.id === existingId
              ? withSessionStatus({
                  ...s,
                  ...payload,
                  status: SESSION_STATUS.ACTIVE,
                  startedAt: payload.startedAt ?? s.startedAt ?? startedAt,
                })
              : s,
          ),
        }
      })
      return existingId
    }

    const liveId = uid('session')
    const next = withSessionStatus({
      ...payload,
      id: liveId,
      status: SESSION_STATUS.ACTIVE,
      startedAt,
    })
    setState((prev) => {
      let sessions = prev.sessions
      const activeNow = findActiveSession(sessions)
      if (activeNow && activeNow.id !== liveId) {
        // Always drop an unfinished #encours when creating a new live session
        // from this path — callers either passed replaceActive or there was none
        // at decision time. Never archive it as a ghost #passée duplicate.
        sessions = sessions.filter((s) => s.id !== activeNow.id)
      }
      return { ...prev, sessions: [next, ...sessions] }
    })
    return liveId
  }, [])

  const duplicateSession = useCallback((session) => {
    const payload = cloneSessionPayload(session)
    const id = uid('session')
    const next = withSessionStatus({
      ...payload,
      status: SESSION_STATUS.PAST,
      id,
    })
    setState((prev) => ({
      ...prev,
      sessions: [next, ...prev.sessions],
    }))
    return { id, session: next }
  }, [])

  const addWeightEntry = useCallback((entry) => {
    const id = uid('w')
    setState((prev) => ({
      ...prev,
      weightEntries: [{ ...entry, id }, ...prev.weightEntries],
    }))
    return id
  }, [])

  const deleteWeightEntry = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      weightEntries: prev.weightEntries.filter((e) => e.id !== id),
    }))
  }, [])

  const updateSettings = useCallback((updates) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }))
  }, [])

  const setExerciseGoal = useCallback((exerciseName, target) => {
    setState((prev) => {
      const goals = { ...prev.settings.exerciseGoals }
      if (target == null || target === '' || Number(target) <= 0) {
        delete goals[exerciseName]
      } else {
        goals[exerciseName] = Number(target)
      }
      return {
        ...prev,
        settings: { ...prev.settings, exerciseGoals: goals },
      }
    })
  }, [])

  const exportData = useCallback(() => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        sessions: state.sessions,
        weightEntries: state.weightEntries,
        settings: state.settings,
      },
      null,
      2,
    )
  }, [state])

  const importData = useCallback((raw) => {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const next = normalizeState({
      sessions: parsed.sessions,
      weightEntries: parsed.weightEntries,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    })
    if (!next) throw new Error('Invalid data')
    setState(next)
    return next
  }, [])

  const sortedSessions = useMemo(
    () => sortSessionsByStatus(state.sessions.map(withSessionStatus)),
    [state.sessions],
  )

  const sortedWeightEntries = useMemo(
    () => [...state.weightEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [state.weightEntries],
  )

  const value = useMemo(
    () => ({
      sessions: sortedSessions,
      weightEntries: sortedWeightEntries,
      settings: state.settings,
      addSession,
      updateSession,
      deleteSession,
      beginLiveSession,
      duplicateSession,
      cloneSessionPayload,
      addWeightEntry,
      deleteWeightEntry,
      updateSettings,
      setExerciseGoal,
      exportData,
      importData,
    }),
    [
      sortedSessions,
      sortedWeightEntries,
      state.settings,
      addSession,
      updateSession,
      deleteSession,
      beginLiveSession,
      duplicateSession,
      addWeightEntry,
      deleteWeightEntry,
      updateSettings,
      setExerciseGoal,
      exportData,
      importData,
    ],
  )

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>
}

export function useFitness() {
  const ctx = useContext(FitnessContext)
  if (!ctx) throw new Error('useFitness must be used within FitnessProvider')
  return ctx
}

export { cloneSessionPayload }
