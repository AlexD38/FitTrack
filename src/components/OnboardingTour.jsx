import { useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

export const TOUR_KEY = 'ft-tour-v1'

const STEPS = [
  { titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body', icon: 'dumbbell' },
  { titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body', icon: 'timer' },
  { titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body', icon: 'play' },
]

export function OnboardingTour({ open, onDone }) {
  const { t } = useLocale()
  const [step, setStep] = useState(0)

  if (!open) return null

  const current = STEPS[step]
  const isLast = step >= STEPS.length - 1
  const icon = uiIcons[current.icon] ?? uiIcons.dumbbell

  const finish = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1')
    } catch {
      /* ignore */
    }
    onDone?.()
  }

  const next = () => {
    if (isLast) finish()
    else setStep((s) => s + 1)
  }

  return (
    <div className="ft-tour" role="dialog" aria-modal="true" aria-labelledby="ft-tour-title">
      <div className="ft-tour__card">
        <div className="ft-tour__icon-wrap" aria-hidden="true">
          <FaIcon icon={icon} className="ft-tour__icon" />
        </div>
        <p className="ft-tour__progress">
          {step + 1} / {STEPS.length}
        </p>
        <h2 id="ft-tour-title" className="ft-tour__title">
          {t(current.titleKey)}
        </h2>
        <p className="ft-tour__body">{t(current.bodyKey)}</p>

        <div className="ft-tour__dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`ft-tour__dot${i === step ? ' ft-tour__dot--active' : ''}`} />
          ))}
        </div>

        <div className="ft-tour__actions">
          {!isLast && (
            <button type="button" className="ft-btn ft-btn--secondary" onClick={finish}>
              {t('onboarding.skip')}
            </button>
          )}
          <button type="button" className="ft-btn ft-btn--primary" onClick={next}>
            {isLast ? t('onboarding.start') : t('common.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
