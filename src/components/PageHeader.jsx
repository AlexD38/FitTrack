export function PageHeader({ title, actions }) {
  return (
    <header className="ft-header">
      <h1 className="ft-header__title">{title}</h1>
      {actions && <div className="ft-header__actions">{actions}</div>}
    </header>
  )
}
