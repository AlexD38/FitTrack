import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { SessionCard } from '../components/SessionCard'
import { EmptyState } from '../components/EmptyState'
import { BottomSheet } from '../components/BottomSheet'
import { SessionForm } from '../components/SessionForm'
import { LiveWorkout } from '../components/LiveWorkout'
import { TemplatePicker } from '../components/TemplatePicker'
import { SessionExercisesView } from '../components/SessionExercisesView'
import { staggerListItems } from '../lib/pageTransition'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'

export function JournalPage({ onOpenSettings }) {
  const {
    sessions,
    updateSession,
    deleteSession,
    cloneSessionPayload,
  } = useFitness()
  const { t } = useLocale()
  const listRef = useRef(null)

  const [sheet, setSheet] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [live, setLive] = useState(null)
  const [startPickerOpen, setStartPickerOpen] = useState(false)

  useEffect(() => {
    if (listRef.current) {
      staggerListItems(listRef.current)
    }
  }, [sessions])

  const openEdit = (session) => setSheet({ mode: 'edit', session })
  const closeSheet = () => setSheet(null)

  const handleSave = useCallback(
    (data) => {
      if (sheet?.mode === 'edit') {
        updateSession(sheet.session.id, data)
        setExpandedId(sheet.session.id)
      }
      closeSheet()
    },
    [sheet, updateSession],
  )

  const handleDeleteFromList = (session) => {
    if (!window.confirm(t('journal.deleteConfirm'))) return
    deleteSession(session.id)
    if (expandedId === session.id) setExpandedId(null)
  }

  const toggleExpand = (session) => {
    setExpandedId((prev) => (prev === session.id ? null : session.id))
  }

  const handleStartLive = (session) => {
    setLive(cloneSessionPayload(session))
  }

  const blankLivePayload = () => ({
    date: new Date().toISOString().slice(0, 10),
    muscles: [],
    notes: '',
    exercises: [{ name: '', sets: [{ weight: 0, reps: '', rpe: '' }] }],
  })

  const handleStartBlankLive = () => {
    setStartPickerOpen(false)
    setLive(blankLivePayload())
  }

  const handleStartFromTemplate = (payload) => {
    setStartPickerOpen(false)
    setLive(payload)
  }

  const handleStartFromPast = (session) => {
    setStartPickerOpen(false)
    setLive(cloneSessionPayload(session))
  }

  return (
    <>
      <PageHeader title={t('journal.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <div className="ft-journal-actions">
        <button type="button" className="ft-btn ft-btn--primary" onClick={() => setStartPickerOpen(true)}>
          {t('live.startBlank')}
        </button>
      </div>

      <div ref={listRef}>
        {sessions.length === 0 ? (
          <EmptyState message={t('journal.empty')} />
        ) : (
          sessions.map((s) => {
            const expanded = expandedId === s.id
            return (
              <SessionCard
                key={s.id}
                session={s}
                expanded={expanded}
                onToggle={toggleExpand}
              >
                <SessionExercisesView exercises={s.exercises} />
                {s.notes && <p className="ft-session-card__notes">{s.notes}</p>}
                <div className="ft-btn-row" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="ft-btn ft-btn--primary"
                    onClick={() => handleStartLive(s)}
                  >
                    {t('live.start')}
                  </button>
                  <button
                    type="button"
                    className="ft-btn ft-btn--secondary"
                    onClick={() => openEdit(s)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="ft-btn ft-btn--danger"
                    onClick={() => handleDeleteFromList(s)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </SessionCard>
            )
          })
        )}
      </div>

      <BottomSheet
        open={startPickerOpen}
        onClose={() => setStartPickerOpen(false)}
        title={t('templates.choose')}
      >
        <p className="ft-templates__hint">{t('templates.startHint')}</p>
        <TemplatePicker
          hideHeader
          onCustom={handleStartBlankLive}
          onSelect={handleStartFromTemplate}
          onSelectPast={handleStartFromPast}
          pastSessions={sessions}
        />
      </BottomSheet>

      <BottomSheet
        open={Boolean(sheet)}
        onClose={closeSheet}
        title={t('journal.editSession')}
      >
        {sheet && (
          <SessionForm
            key={sheet.session.id}
            initial={sheet.session}
            onSave={handleSave}
            onCancel={closeSheet}
          />
        )}
      </BottomSheet>

      <LiveWorkout
        open={Boolean(live)}
        initial={live}
        onClose={() => setLive(null)}
        onSaved={(session) => setExpandedId(session.id)}
      />
    </>
  )
}
