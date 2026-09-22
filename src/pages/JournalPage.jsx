import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { SessionCard } from '../components/SessionCard'
import { EmptyState } from '../components/EmptyState'
import { BottomSheet } from '../components/BottomSheet'
import { SessionForm } from '../components/SessionForm'
import { LiveWorkout } from '../components/LiveWorkout'
import { TemplatePicker } from '../components/TemplatePicker'
import { ExerciseListEditor } from '../components/ExerciseEditor'
import { FaIcon } from '../components/FaIcon'
import { staggerListItems } from '../lib/pageTransition'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { pastSessionsOnly, SESSION_STATUS, findActiveSession, normalizeSessionStatus, resolveSessionStatus, isActiveSession, todayIsoDate } from '../lib/sessionStatus'
import { musclesFromExerciseNames } from '../lib/exercises'
import { uiIcons } from '../lib/icons'

const FILTERS = ['all', SESSION_STATUS.ACTIVE, SESSION_STATUS.UPCOMING, SESSION_STATUS.PAST]

export function JournalPage({ onOpenSettings }) {
  const {
    sessions,
    addSession,
    updateSession,
    deleteSession,
    cloneSessionPayload,
  } = useFitness()
  const { t } = useLocale()
  const listRef = useRef(null)

  const [sheet, setSheet] = useState(null)
  const [liveId, setLiveId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIntent, setPickerIntent] = useState('start') // 'start' | 'plan'
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (listRef.current) {
      staggerListItems(listRef.current)
    }
  }, [sessions, statusFilter])

  const pinnedActive = useMemo(() => {
    if (statusFilter !== 'all' && statusFilter !== SESSION_STATUS.ACTIVE) return []
    return sessions.filter(isActiveSession)
  }, [sessions, statusFilter])

  const filteredSessions = useMemo(() => {
    if (statusFilter === 'all') {
      // Active sessions are rendered in the pinned block above.
      return sessions.filter((s) => !isActiveSession(s))
    }
    if (statusFilter === SESSION_STATUS.ACTIVE) return []
    return sessions.filter((s) => resolveSessionStatus(s) === statusFilter)
  }, [sessions, statusFilter])

  const listEmpty = pinnedActive.length === 0 && filteredSessions.length === 0

  const liveSession = useMemo(
    () => (liveId ? sessions.find((s) => s.id === liveId) : null),
    [sessions, liveId],
  )

  const detailSession = useMemo(() => {
    if (sheet?.mode !== 'detail' || !sheet.session?.id) return sheet?.session ?? null
    return sessions.find((s) => s.id === sheet.session.id) ?? sheet.session
  }, [sheet, sessions])

  const openDetail = (session) => setSheet({ mode: 'detail', session })
  const openEdit = (session) => setSheet({ mode: 'edit', session })
  const closeSheet = () => setSheet(null)

  const openStartPicker = () => {
    setPickerIntent('start')
    setPickerOpen(true)
  }

  const openPlanPicker = () => {
    setPickerIntent('plan')
    setPickerOpen(true)
  }

  const closePicker = () => setPickerOpen(false)

  const handleSave = useCallback(
    (data) => {
      if (sheet?.mode === 'edit' && sheet.session) {
        const wasActive =
          normalizeSessionStatus(sheet.session.status) === SESSION_STATUS.ACTIVE
        updateSession(sheet.session.id, {
          ...data,
          ...(wasActive ? { status: SESSION_STATUS.ACTIVE } : {}),
        })
        if (sheet.fromDetail) {
          setSheet({
            mode: 'detail',
            session: { ...sheet.session, ...data },
          })
          return
        }
      }
      closeSheet()
    },
    [sheet, updateSession],
  )

  const scheduleUpcoming = useCallback(
    (payload) => {
      closePicker()
      const id = addSession({ ...payload, status: SESSION_STATUS.UPCOMING })
      const created = { ...payload, id, status: SESSION_STATUS.UPCOMING }
      setSheet({ mode: 'detail', session: created })
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
    setLiveId(id)
  }, [])

  /** One active session at a time: resume existing, or promote/create. */
  const startOrResumeLive = useCallback(
    (payload, { existingId } = {}) => {
      const active = findActiveSession(sessions)
      if (active && (!existingId || active.id !== existingId)) {
        openLiveById(active.id)
        return
      }
      if (existingId) {
        updateSession(existingId, { ...payload, status: SESSION_STATUS.ACTIVE })
        openLiveById(existingId)
        return
      }
      const id = addSession({ ...payload, status: SESSION_STATUS.ACTIVE })
      openLiveById(id)
    },
    [sessions, addSession, updateSession, openLiveById],
  )

  const handlePrimaryAction = (session) => {
    const status = normalizeSessionStatus(session.status)
    if (status === SESSION_STATUS.ACTIVE) {
      openLiveById(session.id)
      return
    }
    // Lancer / Relancer: copy session → today + #encours (original unchanged)
    const payload = {
      ...cloneSessionPayload(session, todayIsoDate()),
      status: SESSION_STATUS.ACTIVE,
    }
    startOrResumeLive(payload)
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
    startOrResumeLive(payload)
  }

  const handlePickerPast = (session) => {
    const payload = cloneSessionPayload(session)
    if (pickerIntent === 'plan') {
      scheduleUpcoming(payload)
      return
    }
    closePicker()
    startOrResumeLive(payload)
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

      <div className="ft-journal-actions">
        <button type="button" className="ft-btn ft-btn--primary" onClick={openStartPicker}>
          {t('live.startBlank')}
        </button>
        <button type="button" className="ft-btn ft-btn--secondary" onClick={openPlanPicker}>
          {t('journal.planSession')}
        </button>
      </div>

      <div className="ft-journal-filters" role="tablist" aria-label={t('journal.filterStatus')}>
        {FILTERS.map((key) => {
          const active = statusFilter === key
          const label =
            key === 'all' ? t('common.all') : t(`journal.status.${key}`)
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

      <div ref={listRef}>
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
                onEdit={openEdit}
                onReplay={handlePrimaryAction}
                primaryLabel={primaryLabel(s)}
              />
            ))}
            {filteredSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onOpen={openDetail}
                onEdit={openEdit}
                onReplay={handlePrimaryAction}
                primaryLabel={primaryLabel(s)}
              />
            ))}
          </>
        )}
      </div>

      <BottomSheet
        open={pickerOpen}
        onClose={closePicker}
        title={pickerIntent === 'plan' ? t('journal.planSession') : t('templates.choose')}
      >
        <p className="ft-templates__hint">
          {pickerIntent === 'plan' ? t('templates.planHint') : t('templates.startHint')}
        </p>
        <TemplatePicker
          hideHeader
          onCustom={handlePickerCustom}
          onSelect={handlePickerTemplate}
          onSelectPast={handlePickerPast}
          pastSessions={pastSessionsOnly(sessions)}
        />
      </BottomSheet>

      <BottomSheet
        open={sheet?.mode === 'detail' && Boolean(detailSession)}
        onClose={closeSheet}
        title={t('journal.sessionDetail')}
        showBack
      >
        {detailSession && (
          <div className="ft-session-detail">
            <ExerciseListEditor
              exercises={detailSession.exercises?.length ? detailSession.exercises : undefined}
              onChange={(exercises) => {
                const fromEx = musclesFromExerciseNames(exercises.map((e) => e.name))
                const wasActive =
                  normalizeSessionStatus(detailSession.status) === SESSION_STATUS.ACTIVE
                updateSession(detailSession.id, {
                  exercises,
                  muscles: fromEx.length ? fromEx : detailSession.muscles,
                  ...(wasActive ? { status: SESSION_STATUS.ACTIVE } : {}),
                })
              }}
            />
            {detailSession.notes ? (
              <p className="ft-session-card__notes">{detailSession.notes}</p>
            ) : null}
            <div className="ft-session-detail__actions">
              <button
                type="button"
                className="ft-btn ft-btn--secondary"
                onClick={() => {
                  setSheet({ mode: 'edit', session: detailSession, fromDetail: true })
                }}
              >
                <FaIcon icon={uiIcons.edit} className="ft-session-card__delete-icon" />
                {t('common.edit')}
              </button>
              <button
                type="button"
                className="ft-btn ft-btn--danger"
                onClick={() => handleDeleteFromList(detailSession)}
              >
                <FaIcon icon={uiIcons.trash} className="ft-session-card__delete-icon" />
                {t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={sheet?.mode === 'edit'}
        onClose={() => {
          if (sheet?.fromDetail && sheet.session) {
            setSheet({ mode: 'detail', session: sheet.session })
            return
          }
          closeSheet()
        }}
        title={t('journal.editSession')}
        showBack
      >
        {sheet?.mode === 'edit' && sheet.session && (
          <SessionForm
            key={sheet.session.id}
            initial={sheet.session}
            draftMode={normalizeSessionStatus(sheet.session.status) === SESSION_STATUS.UPCOMING}
            onSave={handleSave}
            onCancel={() => {
              if (sheet.fromDetail) {
                setSheet({ mode: 'detail', session: sheet.session })
                return
              }
              closeSheet()
            }}
          />
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
