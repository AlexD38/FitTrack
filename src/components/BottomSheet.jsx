import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '../contexts/LocaleContext'

export function BottomSheet({ open, onClose, title, children }) {
  const { t } = useLocale()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

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
        <div className="ft-sheet__head">
          <h2 id="ft-sheet-title" className="ft-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="ft-sheet__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="ft-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
