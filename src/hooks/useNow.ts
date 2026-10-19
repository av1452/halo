import { useEffect, useState } from 'react'

/** Current time, refreshed on each minute boundary (or every `intervalMs`). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: number
    const schedule = () => {
      const delay = intervalMs - (Date.now() % intervalMs) + 20
      timer = window.setTimeout(() => {
        setNow(new Date())
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [intervalMs])
  return now
}

export function greetingFor(date: Date) {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
