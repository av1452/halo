import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, SearchX } from 'lucide-react'
import { AppIcon } from '../../components/AppIcon'
import { SearchField } from '../../components/SearchField'
import { Sheet } from '../../components/Sheet'
import { showToast } from '../../components/toastStore'
import { smartHome, useSmartHome } from '../../integrations/smart-home'
import { launcherStore, recordOpen } from '../apps/launcherStore'
import { dashboardStore } from '../home/dashboardStore'
import { preferencesStore } from '../settings/preferencesStore'
import { buildIndex, search, type SearchItem } from './searchIndex'
import { setSearchOpen, useSearchOpen, useSearchShortcut } from './searchStore'
import styles from './search.module.css'

function Results({ onDone }: { onDone: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const launcher = launcherStore.use()
  const dashboard = dashboardStore.use()
  const home = useSmartHome()
  const { openLinksInNewTab } = preferencesStore.use()
  const navigate = useNavigate()
  const listId = useId()

  const index = useMemo(() => buildIndex({ launcher, home, dashboard }), [launcher, home, dashboard])
  const groups = search(index, query)
  const flat = groups.flatMap((g) => g.items)
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0))
  const optionId = (item: SearchItem) => `${listId}-${item.id}`

  const run = (item: SearchItem) => {
    const { action } = item
    if (action.kind === 'navigate') navigate(action.to)
    if (action.kind === 'scene') {
      smartHome.activateScene(action.sceneId)
      showToast({ tone: 'success', message: `${action.name} set${smartHome.simulated ? ' (demo)' : ''}` })
    }
    if (action.kind === 'link') {
      if (action.shortcutId) recordOpen(action.shortcutId)
      if (openLinksInNewTab && /^https?:/i.test(action.url)) window.open(action.url, '_blank', 'noopener,noreferrer')
      else window.location.assign(action.url)
    }
    onDone()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!flat.length) return
      setActive((activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length)
    } else if (e.key === 'Enter' && flat[activeIndex]) {
      e.preventDefault()
      run(flat[activeIndex])
    }
  }

  return (
    <div className={styles.search}>
      <SearchField
        label="Search Halo"
        placeholder="Apps, devices, scenes, settings…"
        value={query}
        onChange={(v) => {
          setQuery(v)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={flat.length > 0}
        aria-controls={listId}
        aria-activedescendant={flat[activeIndex] ? optionId(flat[activeIndex]) : undefined}
        aria-autocomplete="list"
        data-autofocus
      />
      {!query.trim() ? (
        <p className={styles.hint}>
          Search your shortcuts, smart-home devices, scenes, media services, widgets, Discover picks and settings. Halo searches its own content, not
          your whole device.
        </p>
      ) : flat.length === 0 ? (
        <div className={styles.empty} role="status">
          <SearchX aria-hidden="true" />
          <p>No results for “{query}”.</p>
        </div>
      ) : (
        <div id={listId} role="listbox" aria-label="Search results" className={styles.results}>
          {groups.map((g) => (
            <div key={g.group} role="group" aria-label={g.group}>
              <p className={styles.groupTitle} aria-hidden="true">{g.group}</p>
              {g.items.map((item) => {
                const index = flat.indexOf(item)
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    id={optionId(item)}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? `${styles.option} ${styles.active}` : styles.option}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(item)}
                  >
                    {item.tile ? (
                      <AppIcon name={item.title} color={item.tile.color} glyph={item.tile.glyph} size={32} />
                    ) : (
                      <span className={styles.optionIcon} aria-hidden="true"><Icon size={18} /></span>
                    )}
                    <span className={styles.optionText}>
                      <span className={styles.optionTitle}>{item.title}</span>
                      {item.subtitle && <span className={styles.optionSubtitle}>{item.subtitle}</span>}
                    </span>
                    {index === activeIndex && <CornerDownLeft size={16} className={styles.enter} aria-hidden="true" />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SearchOverlay() {
  const open = useSearchOpen()
  useSearchShortcut()
  const close = () => setSearchOpen(false)
  // Results remount on each open so the query starts empty
  return (
    <Sheet open={open} title="Search" onClose={close} placement="top">
      {open && <Results onDone={close} />}
    </Sheet>
  )
}
