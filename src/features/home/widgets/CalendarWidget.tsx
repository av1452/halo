import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '../../../components/Button'
import { useNow } from '../../../hooks/useNow'
import { localDateKey, remindersStore } from '../widgetStores'
import { monthMatrix } from './calendar'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function CalendarWidget() {
  const now = useNow()
  const reminders = remindersStore.use()
  const [offset, setOffset] = useState(0)
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const weeks = monthMatrix(view.getFullYear(), view.getMonth())
  const today = localDateKey(now)
  const dueDays = new Set(reminders.filter((r) => !r.done && r.due).map((r) => r.due))
  const weekdayNames = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'narrow' }))
  const monthLabel = view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <WidgetFrame
      title="Calendar"
      icon={CalendarDays}
      action={
        <div className={styles.monthNav}>
          <IconButton label="Previous month" icon={<ChevronLeft />} variant="plain" size="sm" onClick={() => setOffset((o) => o - 1)} />
          <IconButton label="Next month" icon={<ChevronRight />} variant="plain" size="sm" onClick={() => setOffset((o) => o + 1)} />
        </div>
      }
    >
      <p className={styles.monthLabel} aria-live="polite">{monthLabel}</p>
      <table className={styles.calendar}>
        <caption className="visually-hidden">{monthLabel}. Days with reminders due are marked.</caption>
        <thead>
          <tr>{weekdayNames.map((d, i) => <th key={i} scope="col">{d}</th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                if (!day) return <td key={i} />
                const key = localDateKey(day)
                const isToday = key === today
                const due = dueDays.has(key)
                return (
                  <td key={i} className={isToday ? styles.today : undefined} aria-current={isToday ? 'date' : undefined}>
                    {day.getDate()}
                    {due && <span className={styles.dueDot}><span className="visually-hidden">, reminder due</span></span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.fineprint}>Shows reminders from Halo. Connecting an external calendar isn’t supported yet.</p>
    </WidgetFrame>
  )
}
