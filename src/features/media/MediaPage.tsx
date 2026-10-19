import { useSearchParams } from 'react-router-dom'
import { FilterChips } from '../../components/FilterChips'
import { Page, PageSection } from '../../components/Page'
import { mediaStore } from './mediaStore'
import { MediaTile } from './MediaTile'
import { NowPlayingCard } from './NowPlayingCard'
import { CATEGORY_LABELS, MEDIA_SERVICES, type MediaCategory } from './services'
import styles from './media.module.css'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as MediaCategory[]

export default function MediaPage() {
  const { favorites, recents } = mediaStore.use()
  const [params, setParams] = useSearchParams()
  const category = CATEGORIES.find((c) => c === params.get('category')) ?? 'all'
  const byId = (id: string) => MEDIA_SERVICES.find((s) => s.id === id)
  const favoriteServices = favorites.map(byId).filter((s) => !!s)
  const recentServices = recents.map(byId).filter((s) => !!s)
  const shownCategories = category === 'all' ? CATEGORIES : [category]

  return (
    <Page title="Media" subtitle="Your music, video and podcasts in one place">
      <NowPlayingCard />

      {category === 'all' && favoriteServices.length > 0 && (
        <PageSection title="Favorites">
          <ul className={styles.services} aria-label="Favorite services">
            {favoriteServices.map((s) => <MediaTile key={s.id} service={s} />)}
          </ul>
        </PageSection>
      )}

      {category === 'all' && recentServices.length > 0 && (
        <PageSection title="Recently Opened">
          <ul className={styles.services} aria-label="Recently opened services">
            {recentServices.slice(0, 4).map((s) => <MediaTile key={s.id} service={s} />)}
          </ul>
        </PageSection>
      )}

      <FilterChips
        label="Filter by category"
        value={category}
        options={[{ value: 'all', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
        onChange={(v) => setParams(v === 'all' ? {} : { category: v }, { replace: true })}
      />

      {shownCategories.map((c) => (
        <PageSection key={c} title={CATEGORY_LABELS[c]}>
          <ul className={styles.services} aria-label={`${CATEGORY_LABELS[c]} services`}>
            {MEDIA_SERVICES.filter((s) => s.category === c).map((s) => <MediaTile key={s.id} service={s} />)}
          </ul>
        </PageSection>
      ))}

      <p className={styles.footnote}>
        Services open in your browser or, where supported, in their app via Universal Links. Halo doesn’t sign in to them or read your
        listening history.
      </p>
    </Page>
  )
}
