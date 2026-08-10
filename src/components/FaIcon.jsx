import { useMemo } from 'react'
import { icon } from '@fortawesome/fontawesome-svg-core'

export function FaIcon({ icon: iconDef, className }) {
  const markup = useMemo(() => icon(iconDef).html[0], [iconDef])
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
}
