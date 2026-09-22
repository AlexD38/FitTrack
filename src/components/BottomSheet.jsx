import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'
import { lockBodyScroll, unlockBodyScroll } from '../lib/bodyScrollLock'

export function BottomSheet({ open, onClose, title, children, showBack = false }) {
  const { t } = useLocale()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="ft-sheet-root" role="presentation">
      <button
        type="button"
        className="ft-sheet-backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        className="ft-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ft-sheet-title"
      >
        <div className="ft-sheet__handle" aria-hidden="true" />
        <div className={`ft-sheet__head${showBack ? ' ft-sheet__head--back' : ''}`}>
          {showBack && (
            <button
              type="button"
              className="ft-sheet__back"
              onClick={onClose}
              aria-label={t('common.back')}
            >
              <FaIcon icon={uiIcons.chevronLeft} className="ft-sheet__back-icon" />
            </button>
          )}
          <h2 id="ft-sheet-title" className="ft-sheet__title">
            {title}
          </h2>
          {showBack ? (
            <span className="ft-sheet__head-spacer" aria-hidden="true" />
          ) : (
            <button
              type="button"
              className="ft-sheet__close"
              onClick={onClose}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="ft-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
