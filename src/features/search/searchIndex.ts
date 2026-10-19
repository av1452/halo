import {
  Accessibility, Compass, Database, Download, Folder, Globe, Info, LayoutDashboard, Lightbulb, Music, Palette, Settings, Shield, Sparkles, Store,
  type LucideIcon,
} from 'lucide-react'
import { SECTIONS } from '../../app/sections'
import type { HomeSnapshot } from '../../integrations/smart-home'
import type { LauncherState } from '../apps/model'
import { CATALOG, CATEGORY_LABELS as DISCOVER_CATEGORIES } from '../discover/catalog'
import type { WidgetInstance } from '../home/dashboardStore'
import { WIDGETS } from '../home/widgets/registry'
import { MEDIA_SERVICES, CATEGORY_LABELS as MEDIA_CATEGORIES } from '../media/services'

export type SearchGroup = 'Sections' | 'Apps' | 'Smart Home' | 'Media' | 'Dashboard' | 'Discover' | 'Settings'

export type SearchAction =
  | { kind: 'navigate'; to: string }
  | { kind: 'link'; url: string; shortcutId?: string }
  | { kind: 'scene'; sceneId: string; name: string }

export interface SearchItem {
  id: string
  group: SearchGroup
  title: string
  subtitle?: string
  keywords?: string
  icon: LucideIcon
  /** Optional app-tile appearance for shortcuts */
  tile?: { color: string; glyph?: string }
  action: SearchAction
}

export const GROUP_ORDER: SearchGroup[] = ['Sections', 'Apps', 'Smart Home', 'Media', 'Dashboard', 'Discover', 'Settings']

const SETTINGS_ENTRIES: { title: string; hash: string; keywords: string; icon: LucideIcon }[] = [
  { title: 'Appearance', hash: 'appearance', keywords: 'theme dark light mode accent color colour wallpaper background glass blur', icon: Palette },
  { title: 'Accessibility', hash: 'accessibility', keywords: 'reduce motion transparency contrast animation', icon: Accessibility },
  { title: 'Install Halo', hash: 'install', keywords: 'install add home screen pwa offline app standalone', icon: Download },
  { title: 'Data & Backup', hash: 'data', keywords: 'export import backup reset erase restore json', icon: Database },
  { title: 'Privacy', hash: 'privacy', keywords: 'privacy data external services tracking network', icon: Shield },
  { title: 'About Halo', hash: 'about', keywords: 'version about independent', icon: Info },
]

export interface IndexSources {
  launcher: LauncherState
  home: HomeSnapshot
  dashboard: WidgetInstance[]
}

/** Builds the searchable list from current app state. Cheap enough to run per query. */
export function buildIndex({ launcher, home, dashboard }: IndexSources): SearchItem[] {
  const items: SearchItem[] = []

  for (const s of SECTIONS) {
    items.push({ id: `section-${s.id}`, group: 'Sections', title: s.label, icon: s.icon, action: { kind: 'navigate', to: s.path } })
  }

  for (const s of launcher.shortcuts) {
    const folder = launcher.folders.find((f) => f.id === s.folderId)
    items.push({
      id: `shortcut-${s.id}`,
      group: 'Apps',
      title: s.name,
      subtitle: folder ? `Shortcut · ${folder.name}` : 'Shortcut',
      keywords: `${s.url} ${s.description ?? ''}`,
      icon: Globe,
      tile: { color: s.color, glyph: s.glyph },
      action: { kind: 'link', url: s.url, shortcutId: s.id },
    })
  }
  for (const f of launcher.folders) {
    items.push({ id: `folder-${f.id}`, group: 'Apps', title: f.name, subtitle: 'Folder', icon: Folder, action: { kind: 'navigate', to: `/apps?filter=${encodeURIComponent(f.id)}` } })
  }

  for (const d of home.devices) {
    const room = home.rooms.find((r) => r.id === d.roomId)
    items.push({ id: `device-${d.id}`, group: 'Smart Home', title: d.name, subtitle: `${room?.name ?? ''} · ${d.type}`, keywords: d.type, icon: Lightbulb, action: { kind: 'navigate', to: `/smart-home?device=${encodeURIComponent(d.id)}` } })
  }
  for (const r of home.rooms) {
    items.push({ id: `room-${r.id}`, group: 'Smart Home', title: r.name, subtitle: 'Room', icon: Lightbulb, action: { kind: 'navigate', to: `/smart-home?room=${encodeURIComponent(r.id)}` } })
  }
  for (const s of home.scenes) {
    items.push({ id: `scene-${s.id}`, group: 'Smart Home', title: s.name, subtitle: 'Scene · runs now', keywords: 'scene', icon: Sparkles, action: { kind: 'scene', sceneId: s.id, name: s.name } })
  }

  for (const m of MEDIA_SERVICES) {
    items.push({ id: `media-${m.id}`, group: 'Media', title: m.name, subtitle: MEDIA_CATEGORIES[m.category], icon: Music, tile: { color: m.color, glyph: m.glyph }, action: { kind: 'link', url: m.url } })
  }

  for (const [type, def] of Object.entries(WIDGETS)) {
    const onDashboard = dashboard.some((w) => w.type === type)
    items.push({
      id: `widget-${type}`,
      group: 'Dashboard',
      title: def.title,
      subtitle: onDashboard ? 'Widget on Home' : 'Widget · not on Home',
      keywords: def.description,
      icon: LayoutDashboard,
      action: { kind: 'navigate', to: '/' },
    })
  }

  for (const l of CATALOG) {
    items.push({ id: `discover-${l.id}`, group: 'Discover', title: l.name, subtitle: `${l.developer} · ${DISCOVER_CATEGORIES[l.category]}`, keywords: l.summary, icon: Store, action: { kind: 'navigate', to: `/discover?app=${l.id}` } })
  }

  for (const s of SETTINGS_ENTRIES) {
    items.push({ id: `settings-${s.hash}`, group: 'Settings', title: s.title, subtitle: 'Settings', keywords: s.keywords, icon: s.icon, action: { kind: 'navigate', to: `/settings#${s.hash}` } })
  }
  items.push({ id: 'settings-root', group: 'Settings', title: 'Settings', icon: Settings, keywords: 'preferences options', action: { kind: 'navigate', to: '/settings' } })
  items.push({ id: 'discover-store', group: 'Discover', title: 'Search the App Store', subtitle: 'Opens Discover', icon: Compass, keywords: 'install download app store', action: { kind: 'navigate', to: '/discover' } })

  return items
}

/** Higher is better; 0 means no match. */
export function scoreItem(item: SearchItem, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const title = item.title.toLowerCase()
  if (title === q) return 100
  if (title.startsWith(q)) return 80
  if (title.split(/[\s\-·]+/).some((w) => w.startsWith(q))) return 60
  if (title.includes(q)) return 40
  const rest = `${item.subtitle ?? ''} ${item.keywords ?? ''}`.toLowerCase()
  if (rest.split(/[\s\-·/.:]+/).some((w) => w.startsWith(q))) return 20
  if (rest.includes(q)) return 10
  return 0
}

export interface GroupedResults {
  group: SearchGroup
  items: SearchItem[]
}

export function search(items: SearchItem[], query: string, perGroup = 6): GroupedResults[] {
  const scored = items.map((item) => ({ item, score: scoreItem(item, query) })).filter((x) => x.score > 0)
  return GROUP_ORDER.map((group) => ({
    group,
    items: scored
      .filter((x) => x.item.group === group)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, perGroup)
      .map((x) => x.item),
  })).filter((g) => g.items.length > 0)
}
