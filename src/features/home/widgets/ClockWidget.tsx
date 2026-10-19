import { Clock } from 'lucide-react'
import { useNow } from '../../../hooks/useNow'
import { preferencesStore } from '../../settings/preferencesStore'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function ClockWidget() {
  const now = useNow()
  const { use24HourClock } = preferencesStore.use()
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: !use24HourClock })
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone?.replace(/_/g, ' ')
  return (
    <WidgetFrame title="Clock" icon={Clock}>
      <time className={styles.bigTime} dateTime={now.toISOString()}>{time}</time>
      <p className={styles.muted}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      {zone && <p className={styles.muted}>{zone}</p>}
    </WidgetFrame>
  )
}
