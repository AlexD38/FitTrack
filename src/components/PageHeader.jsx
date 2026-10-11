export function PageHeader({ title, subtitle, actions, badge }) {
  return (
    <header className="ft-header">
      <div className="ft-header__main">
        {badge && <span className="ft-header__badge">{badge}</span>}
        <h1 className="ft-header__title">{title}</h1>
        {subtitle && <p className="ft-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ft-header__actions">{actions}</div>}
    </header>
  )
}
