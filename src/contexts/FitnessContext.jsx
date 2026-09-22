/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { DEFAULT_PALETTE, isValidPalette } from '../lib/palettes'
import { SESSION_STATUS, sortSessionsByStatus, withSessionStatus } from '../lib/sessionStatus'

export const STORAGE_KEY = 'fitness-v1'

const DEFAULT_SETTINGS = {
  locale: 'fr',
  theme: 'dark',
  palette: DEFAULT_PALETTE,
  weightUnit: 'kg',
  defaultRestSeconds: 90,
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
