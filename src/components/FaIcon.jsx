import { useMemo } from 'react'
import { icon } from '@fortawesome/fontawesome-svg-core'

export function FaIcon({ icon: iconDef, className, style }) {
  const markup = useMemo(() => icon(iconDef).html[0], [iconDef])
  return (
    <span className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
  )
}
