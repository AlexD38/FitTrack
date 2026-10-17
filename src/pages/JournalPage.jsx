import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { SessionCard } from '../components/SessionCard'
import { EmptyState } from '../components/EmptyState'
import { BottomSheet } from '../components/BottomSheet'
import { LiveWorkout } from '../components/LiveWorkout'
import { TemplatePicker } from '../components/TemplatePicker'
import { ExerciseListEditor } from '../components/ExerciseEditor'
import { BodyMuscleMap } from '../components/BodyMuscleMap'
import { Fab } from '../components/Fab'
import { FaIcon } from '../components/FaIcon'
import { staggerListItems } from '../lib/pageTransition'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import {
  pastSessionsOnly,
  SESSION_STATUS,
  normalizeSessionStatus,
  resolveSessionStatus,
  isActiveSession,
  todayIsoDate,
} from '../lib/sessionStatus'
import { musclesFromExerciseNames } from '../lib/exercises'
import { formatDuration } from '../lib/duration'
import { uiIcons } from '../lib/icons'

const FILTERS = ['all', SESSION_STATUS.ACTIVE, SESSION_STATUS.UPCOMING, SESSION_STATUS.PAST]

export function JournalPage({ onOpenSettings }) {
  const {
    sessions,
    addSession,
    updateSession,
    deleteSession,
    beginLiveSession,
    cloneSessionPayload,
  } = useFitness()
  const { t } = useLocale()
  const listRef = useRef(null)
  const startingRef = useRef(false)

  const [sheet, setSheet] = useState(null)
  const [liveId, setLiveId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIntent, setPickerIntent] = useState('start') // 'start' | 'plan'
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (listRef.current) staggerListItems(listRef.current)
  }, [sessions, statusFilter])

  const pinnedActive = useMemo(() => {
    if (statusFilter !== 'all' && statusFilter !== SESSION_STATUS.ACTIVE) return []
    return sessions.filter(isActiveSession)
  }, [sessions, statusFilter])

  const filteredSessions = useMemo(() => {
    if (statusFilter === 'all') return sessions.filter((s) => !isActiveSession(s))
    if (statusFilter === SESSION_STATUS.ACTIVE) return []
    return sessions.filter((s) => resolveSessionStatus(s) === statusFilter)
  }, [sessions, statusFilter])

  const listEmpty = pinnedActive.length === 0 && filteredSessions.length === 0

  const liveSession = useMemo(
    () => (liveId ? sessions.find((s) => s.id === liveId) : null),
    [sessions, liveId],
  )

  const detailSession = useMemo(() => {
    if (sheet?.mode !== 'detail' || !sheet.session?.id) return null
    return sessions.find((s) => s.id === sheet.session.id) ?? sheet.session
  }, [sheet, sessions])

  const openDetail = (session) => setSheet({ mode: 'detail', session })
  const closeSheet = () => setSheet(null)

  const patchDetailSession = useCallback(
    (patch) => {
      if (!detailSession?.id) return
      const wasActive = normalizeSessionStatus(detailSession.status) === SESSION_STATUS.ACTIVE
      updateSession(detailSession.id, {
        ...patch,
        ...(wasActive ? { status: SESSION_STATUS.ACTIVE } : {}),
      })
    },
    [detailSession, updateSession],
  )

  const openNewSessionPicker = () => {
    setPickerIntent('start')
    setPickerOpen(true)
  }

  const closePicker = () => setPickerOpen(false)

  const scheduleUpcoming = useCallback(
    (payload) => {
      closePicker()
      const id = addSession({ ...payload, status: SESSION_STATUS.UPCOMING })
      setSheet({ mode: 'detail', session: { ...payload, id, status: SESSION_STATUS.UPCOMING } })
      return id
    },
    [addSession],
  )

  const handleDeleteFromList = (session) => {
    if (!window.confirm(t('journal.deleteConfirm'))) return
    deleteSession(session.id)
    if (liveId === session.id) setLiveId(null)
    closeSheet()
  }

  const openLiveById = useCallback((id) => {
    if (!id) return
    setLiveId(id)
  }, [])

  const startOrResumeLive = useCallback(
    (payload, { existingId, replaceActive = false } = {}) => {
      // Guard against double-taps creating two live sessions in one gesture.
      if (startingRef.current) return
      startingRef.current = true
      try {
        const id = beginLiveSession(payload, { existingId, replaceActive })
        openLiveById(id)
      } finally {
        // Release on next tick so a second click in the same frame is ignored,
        // but a later intentional start still works.
        queueMicrotask(() => {
          startingRef.current = false
        })
      }
    },
    [beginLiveSession, openLiveById],
  )

  const handlePrimaryAction = (session) => {
    const status = normalizeSessionStatus(session.status)
    if (status === SESSION_STATUS.ACTIVE) {
      openLiveById(session.id)
      return
    }
    closeSheet()
    const payload = {
      ...cloneSessionPayload(session, todayIsoDate()),
      status: SESSION_STATUS.ACTIVE,
    }
    // Upcoming: promote the same card in place (no clone).
    // Past: Relancer creates a new session so history stays intact.
    startOrResumeLive(payload, {
      existingId: status === SESSION_STATUS.UPCOMING ? session.id : undefined,
      replaceActive: true,
    })
  }

  const blankLivePayload = () => ({
    date: new Date().toISOString().slice(0, 10),
    muscles: [],
    notes: '',
    exercises: [{ name: '', sets: [{ weight: 0, reps: '', rpe: 5 }] }],
  })

  const handlePickerCustom = () => {
    if (pickerIntent === 'plan') {
      scheduleUpcoming(blankLivePayload())
      return
    }
    closePicker()
    startOrResumeLive(blankLivePayload())
  }

  const handlePickerTemplate = (payload) => {
    if (pickerIntent === 'plan') {
      scheduleUpcoming(payload)
      return
    }
    closePicker()
    startOrResumeLive(payload, { replaceActive: true })
  }

  const handlePickerPast = (session) => {
    const payload = cloneSessionPayload(session)
    if (pickerIntent === 'plan') {
      scheduleUpcoming(payload)
      return
    }
    closePicker()
    startOrResumeLive(payload, { replaceActive: true })
  }

  const primaryLabel = (session) => {
    const status = normalizeSessionStatus(session.status)
    if (status === SESSION_STATUS.ACTIVE) return t('live.resume')
    if (status === SESSION_STATUS.UPCOMING) return t('live.start')
    return t('live.replay')
  }

  return (
    <>
      <PageHeader title={t('journal.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <div className="ft-journal-filters" role="tablist" aria-label={t('journal.filterStatus')}>
        {FILTERS.map((key) => {
          const active = statusFilter === key
          const label = key === 'all' ? t('common.all') : t(`journal.status.${key}`)
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`ft-chip${active ? ' ft-chip--active' : ''}${
                key !== 'all' ? ` ft-status-chip ft-status-chip--${key}` : ''
              }`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div ref={listRef} className="ft-journal-list">
        {listEmpty ? (
          <EmptyState message={t('journal.empty')} />
        ) : (
          <>
            {pinnedActive.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                pinned
                onOpen={openDetail}
                onReplay={handlePrimaryAction}
                onDelete={handleDeleteFromList}
                primaryLabel={primaryLabel(s)}
              />
            ))}
            {filteredSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onOpen={openDetail}
                onReplay={handlePrimaryAction}
                onDelete={handleDeleteFromList}
                primaryLabel={primaryLabel(s)}
              />
            ))}
          </>
        )}
      </div>

      <Fab onClick={openNewSessionPicker} label={t('journal.newSession')} />

      <BottomSheet
        open={pickerOpen}
        onClose={closePicker}
        title={t('journal.newSession')}
      >
        <div className="ft-journal-intent" role="group" aria-label={t('journal.newSession')}>
          <button
            type="button"
            className={`ft-journal-intent__btn${
              pickerIntent === 'start' ? ' ft-journal-intent__btn--primary' : ''
            }`}
            onClick={() => setPickerIntent('start')}
          >
            <span className="ft-journal-intent__title">{t('live.start')}</span>
            <span className="ft-journal-intent__hint">{t('templates.startHint')}</span>
          </button>
          <button
            type="button"
            className={`ft-journal-intent__btn${
              pickerIntent === 'plan' ? ' ft-journal-intent__btn--primary' : ''
            }`}
            onClick={() => setPickerIntent('plan')}
          >
            <span className="ft-journal-intent__title">{t('journal.planSession')}</span>
            <span className="ft-journal-intent__hint">{t('templates.planHint')}</span>
          </button>
        </div>
        <TemplatePicker
          hideHeader
          onCustom={handlePickerCustom}
          onSelect={handlePickerTemplate}
          onSelectPast={handlePickerPast}
          pastSessions={pastSessionsOnly(sessions)}
        />
      </BottomSheet>

      <BottomSheet
        open={Boolean(detailSession)}
        onClose={closeSheet}
        title={t('journal.sessionDetail')}
        showBack
      >
        {detailSession && (
          <div className="ft-session-detail">
            <div className="ft-session-detail__sticky">
              {(detailSession.muscles?.length ?? 0) > 0 && (
                <BodyMuscleMap
                  active={detailSession.muscles}
                  size="sm"
                  className="ft-session-detail__map"
                />
              )}
              <button
                type="button"
                className="ft-btn ft-btn--primary ft-session-detail__cta"
                onClick={() => handlePrimaryAction(detailSession)}
              >
                <FaIcon icon={uiIcons.play} className="ft-session-card__action-icon" />
                {primaryLabel(detailSession)}
              </button>
            </div>

            <label className="ft-field">
              <span className="ft-field__label">{t('journal.date')}</span>
              <input
                className="ft-input"
                type="date"
                value={detailSession.date}
                onChange={(e) => patchDetailSession({ date: e.target.value })}
              />
            </label>

            {detailSession.durationSeconds > 0 && (
              <p className="ft-session-detail__duration">
                {t('journal.duration')}: {formatDuration(detailSession.durationSeconds)}
              </p>
            )}

            <label className="ft-field">
              <span className="ft-field__label">{t('journal.notes')}</span>
              <textarea
                className="ft-input"
                rows={3}
                value={detailSession.notes ?? ''}
                onChange={(e) => patchDetailSession({ notes: e.target.value })}
                placeholder={t('journal.notes')}
              />
            </label>

            <ExerciseListEditor
              exercises={detailSession.exercises?.length ? detailSession.exercises : undefined}
              onChange={(exercises) => {
                const fromEx = musclesFromExerciseNames(exercises.map((e) => e.name))
                patchDetailSession({
                  exercises,
                  muscles: fromEx.length ? fromEx : detailSession.muscles,
                })
              }}
            />

            <button
              type="button"
              className="ft-btn ft-btn--danger ft-session-detail__delete"
              onClick={() => handleDeleteFromList(detailSession)}
            >
              <FaIcon icon={uiIcons.trash} className="ft-session-card__delete-icon" />
              {t('common.delete')}
            </button>
          </div>
        )}
      </BottomSheet>

      <LiveWorkout
        open={Boolean(liveId && liveSession)}
        sessionId={liveId}
        initial={liveSession}
        onClose={() => setLiveId(null)}
        onSaved={(session) => openDetail(session)}
      />
    </>
  )
}
