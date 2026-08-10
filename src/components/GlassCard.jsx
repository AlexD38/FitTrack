export function GlassCard({ className = '', children, onClick, ...props }) {
  const cls = `ft-glass ft-glass--pad${className ? ` ${className}` : ''}`
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} {...props}>
        {children}
      </button>
    )
  }
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  )
}
