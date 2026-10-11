export function EmptyState({ message, actionLabel, onAction, title }) {
  return (
    <div className="ft-empty-state">
      {title && <p className="ft-empty-state__title">{title}</p>}
      <p className="ft-empty">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="ft-btn ft-btn--primary ft-empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
