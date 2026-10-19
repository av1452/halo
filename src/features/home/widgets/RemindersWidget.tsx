import { useState, type FormEvent } from 'react'
import { ListTodo, Plus } from 'lucide-react'
import { Button, IconButton } from '../../../components/Button'
import { useNow } from '../../../hooks/useNow'
import { addReminder, clearCompletedReminders, localDateKey, remindersStore, toggleReminder } from '../widgetStores'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

function dueLabel(due: string, today: string) {
  if (due === today) return 'Today'
  if (due < today) return 'Overdue'
  const [y, m, d] = due.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function RemindersWidget() {
  const reminders = remindersStore.use()
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const today = localDateKey(useNow())
  const sorted = [...reminders].sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  const doneCount = reminders.filter((r) => r.done).length

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addReminder(text, due || undefined)
    setText('')
    setDue('')
  }

  return (
    <WidgetFrame
      title="Reminders"
      icon={ListTodo}
      action={doneCount > 0 && <Button size="sm" variant="plain" onClick={clearCompletedReminders}>Clear done</Button>}
    >
      {sorted.length === 0 && <p className={styles.muted}>Nothing to remember yet. Reminders stay on this device.</p>}
      <ul className={styles.reminders}>
        {sorted.slice(0, 6).map((r) => (
          <li key={r.id} className={r.done ? styles.reminderDone : undefined}>
            <label>
              <input type="checkbox" checked={r.done} onChange={() => toggleReminder(r.id)} />
              <span className={styles.reminderText}>{r.text}</span>
            </label>
            {r.due && !r.done && (
              <span className={r.due < today ? styles.overdue : styles.dueTag}>{dueLabel(r.due, today)}</span>
            )}
          </li>
        ))}
      </ul>
      {sorted.length > 6 && <p className={styles.fineprint}>+{sorted.length - 6} more</p>}
      <form className={styles.reminderForm} onSubmit={submit}>
        <input aria-label="New reminder" placeholder="New reminder" value={text} maxLength={140} onChange={(e) => setText(e.target.value)} />
        <input type="date" aria-label="Due date (optional)" value={due} onChange={(e) => setDue(e.target.value)} />
        <IconButton type="submit" label="Add reminder" icon={<Plus />} variant="filled" size="sm" disabled={!text.trim()} />
      </form>
    </WidgetFrame>
  )
}
