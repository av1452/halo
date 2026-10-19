import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SearchX } from 'lucide-react'
import { Button } from '../../components/Button'
import { FilterChips } from '../../components/FilterChips'
import { EmptyState, Page, PageSection } from '../../components/Page'
import { SearchField } from '../../components/SearchField'
import { AppStoreError, searchApps, type AppStoreApp } from '../../services/appStore'
import { AppDetailSheet, type Selection } from './AppDetailSheet'
import { CATALOG, CATEGORY_LABELS, matchesListing, type DiscoverCategory, type Listing } from './catalog'
import { discoverStore, recordViewed, type SavedApp } from './discoverStore'
import { ListingCard } from './ListingCard'
import styles from './discover.module.css'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DiscoverCategory[]

type LiveState = { term: string; status: 'loading' | 'done' | 'error'; results: AppStoreApp[]; error?: string } | null

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = CATEGORIES.find((c) => c === params.get('category')) ?? 'all'
  const { favorites, recents } = discoverStore.use()
  const [selection, setSelection] = useState<Selection | null>(null)
  const [live, setLive] = useState<LiveState>(null)

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const open = (sel: Selection) => {
    recordViewed({ id: sel.id, name: sel.name, developer: sel.developer, iconUrl: sel.iconUrl })
    setSelection(sel)
  }
  const openListing = (l: Listing) => open({ id: l.id, name: l.name, developer: l.developer, summary: l.summary, website: l.website, curated: true })
  const openSaved = (s: SavedApp) => {
    const listing = CATALOG.find((l) => l.id === s.id)
    if (listing) openListing(listing)
    else open({ ...s, curated: false })
  }

  const searchStore = async (e?: FormEvent) => {
    e?.preventDefault()
    const term = query.trim()
    if (!term) return
    setLive({ term, status: 'loading', results: [] })
    try {
      setLive({ term, status: 'done', results: await searchApps(term) })
    } catch (err) {
      setLive({ term, status: 'error', results: [], error: err instanceof AppStoreError ? err.message : 'Search failed.' })
    }
  }

  const curated = CATALOG.filter((l) => (category === 'all' || l.category === category) && matchesListing(l, query))
  const browsing = !query && category === 'all'

  return (
    <Page title="Discover" subtitle="Find apps worth installing">
      <form className={styles.searchRow} onSubmit={searchStore} role="search">
        <SearchField label="Search apps" placeholder="Search apps" value={query} onChange={(v) => setParam('q', v, '')} />
        <Button type="submit" variant="primary" icon={<Search size={18} />} disabled={!query.trim()}>App Store</Button>
      </form>
      <p className={styles.privacy}>Typing filters Halo’s picks on your device. “App Store” sends your search term to Apple.</p>

      <FilterChips
        label="Filter by category"
        value={category}
        options={[{ value: 'all', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
        onChange={(v) => setParam('category', v, 'all')}
      />

      {live && live.term === query.trim() && (
        <PageSection title={`App Store results for “${live.term}”`}>
          {live.status === 'loading' && <p className={styles.privacy} role="status">Searching the App Store…</p>}
          {live.status === 'error' && <p className={styles.errorOnWallpaper} role="alert">{live.error}</p>}
          {live.status === 'done' && live.results.length === 0 && <p className={styles.privacy}>No App Store results.</p>}
          {live.results.length > 0 && (
            <ul className={styles.list} aria-label="App Store results">
              {live.results.map((a) => (
                <ListingCard
                  key={a.id}
                  name={a.name}
                  developer={a.developer}
                  detail={[a.genre, a.price].filter(Boolean).join(' · ')}
                  iconUrl={a.iconUrl}
                  onOpen={() => open({ id: a.id, name: a.name, developer: a.developer, iconUrl: a.iconUrl, curated: false })}
                />
              ))}
            </ul>
          )}
        </PageSection>
      )}

      {browsing && (
        <PageSection title="Featured">
          <ul className={styles.featured} aria-label="Featured apps">
            {CATALOG.filter((l) => l.featured).map((l) => (
              <ListingCard key={l.id} name={l.name} developer={l.developer} detail={l.summary} onOpen={() => openListing(l)} />
            ))}
          </ul>
        </PageSection>
      )}

      {browsing && favorites.length > 0 && (
        <PageSection title="Favorites">
          <ul className={styles.list} aria-label="Favorite apps">
            {favorites.map((f) => <ListingCard key={f.id} name={f.name} developer={f.developer} iconUrl={f.iconUrl} onOpen={() => openSaved(f)} />)}
          </ul>
        </PageSection>
      )}

      {browsing && recents.length > 0 && (
        <PageSection title="Recently Viewed">
          <ul className={styles.list} aria-label="Recently viewed apps">
            {recents.slice(0, 4).map((r) => <ListingCard key={r.id} name={r.name} developer={r.developer} iconUrl={r.iconUrl} onOpen={() => openSaved(r)} />)}
          </ul>
        </PageSection>
      )}

      <PageSection title={category === 'all' ? 'Halo Picks' : CATEGORY_LABELS[category]}>
        {curated.length > 0 ? (
          <ul className={styles.list} aria-label="Halo picks">
            {curated.map((l) => (
              <ListingCard key={l.id} name={l.name} developer={l.developer} detail={CATEGORY_LABELS[l.category]} onOpen={() => openListing(l)} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<SearchX />}
            title="No matching picks"
            action={query.trim() && <Button variant="primary" onClick={() => void searchStore()}>Search the App Store</Button>}
          >
            Halo’s list is small and hand-picked. Try the App Store for more.
          </EmptyState>
        )}
        <p className={styles.privacy}>Halo picks are a manually maintained list, not paid placements or live rankings.</p>
      </PageSection>

      {selection && <AppDetailSheet key={selection.id} selection={selection} onClose={() => setSelection(null)} />}
    </Page>
  )
}
