export function Chip({ active, onClick, children, style }) {
  return (
    <button
      type="button"
      className={`ft-chip${active ? ' ft-chip--active' : ''}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  )
}
