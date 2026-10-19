import { ChevronRight } from 'lucide-react'
import { ListingIcon } from './ListingIcon'
import styles from './discover.module.css'

interface ListingCardProps {
  name: string
  developer: string
  detail?: string
  iconUrl?: string
  onOpen: () => void
}

export function ListingCard({ name, developer, detail, iconUrl, onOpen }: ListingCardProps) {
  return (
    <li>
      <button type="button" className={`glass-thin ${styles.card}`} onClick={onOpen}>
        <ListingIcon name={name} iconUrl={iconUrl} />
        <span className={styles.cardText}>
          <span className={styles.cardName}>{name}</span>
          <span className={styles.cardMeta}>{developer}</span>
          {detail && <span className={styles.cardDetail}>{detail}</span>}
        </span>
        <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
      </button>
    </li>
  )
}
