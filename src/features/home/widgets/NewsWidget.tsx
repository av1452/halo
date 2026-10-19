import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'
import { Button } from '../../../components/Button'
import { fetchTopStories, type Story } from '../../../services/news'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function NewsWidget() {
  const [stories, setStories] = useState<Story[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchTopStories()
      .then((s) => !cancelled && (setStories(s), setError(false)))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [attempt])

  return (
    <WidgetFrame title="Hacker News" icon={Newspaper}>
      {error ? (
        <div className={styles.setup}>
          <p className={styles.error} role="alert">Couldn’t load stories. You may be offline.</p>
          <Button size="sm" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
        </div>
      ) : !stories ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <ol className={styles.news}>
          {stories.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
              <span className={styles.fineprint}>{s.score} points</span>
            </li>
          ))}
        </ol>
      )}
      <p className={styles.fineprint}>Live from the public Hacker News API.</p>
    </WidgetFrame>
  )
}
