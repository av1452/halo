import { LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppIcon } from '../../../components/AppIcon'
import { launcherStore } from '../../apps/launcherStore'
import { linkProps, useLaunch } from '../../apps/useLaunch'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function AppsWidget() {
  const { shortcuts } = launcherStore.use()
  const { onOpen, newTab } = useLaunch()
  const favorites = shortcuts.filter((s) => s.favorite).slice(0, 8)
  return (
    <WidgetFrame title="Favorite Apps" icon={LayoutGrid} action={<Link to="/apps" className={styles.link}>All apps</Link>}>
      {favorites.length === 0 ? (
        <p className={styles.muted}>Mark shortcuts as favorites in Apps to pin them here.</p>
      ) : (
        <ul className={styles.appRow}>
          {favorites.map((s) => (
            <li key={s.id}>
              <a {...linkProps(s.url, newTab)} className={styles.appLink} onClick={() => onOpen(s)}>
                <AppIcon name={s.name} color={s.color} glyph={s.glyph} size={52} />
                <span>{s.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </WidgetFrame>
  )
}
