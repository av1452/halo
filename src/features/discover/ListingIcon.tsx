import { useState } from 'react'
import { AppIcon } from '../../components/AppIcon'
import styles from './discover.module.css'

const COLORS = ['#0a84ff', '#5e5ce6', '#bf5af2', '#ff375f', '#ff9f0a', '#30b158', '#40b3c8']

/** Apple-provided artwork when available, otherwise a lettermark. */
export function ListingIcon({ name, iconUrl, size = 56 }: { name: string; iconUrl?: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (iconUrl && !failed) {
    return <img className={styles.icon} src={iconUrl} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  }
  const color = COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length]
  return <AppIcon name={name} color={color} size={size} />
}
