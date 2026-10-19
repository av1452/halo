import {
  CalendarDays, Clock, CloudSun, LayoutGrid, Lightbulb, ListTodo, Music, Newspaper, StickyNote, Zap, type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { NowPlayingCard } from '../../media/NowPlayingCard'
import type { WidgetType } from '../dashboardStore'
import { AppsWidget } from './AppsWidget'
import { CalendarWidget } from './CalendarWidget'
import { ClockWidget } from './ClockWidget'
import { NewsWidget } from './NewsWidget'
import { NotesWidget } from './NotesWidget'
import { QuickActionsWidget } from './QuickActionsWidget'
import { RemindersWidget } from './RemindersWidget'
import { SmartHomeWidget } from './SmartHomeWidget'
import { WeatherWidget } from './WeatherWidget'

export interface WidgetDefinition {
  title: string
  description: string
  icon: LucideIcon
  component: ComponentType
}

export const WIDGETS: Record<WidgetType, WidgetDefinition> = {
  clock: { title: 'Clock', description: 'Time, date and time zone.', icon: Clock, component: ClockWidget },
  weather: { title: 'Weather', description: 'Live conditions from Open-Meteo for a place you choose.', icon: CloudSun, component: WeatherWidget },
  apps: { title: 'Favorite Apps', description: 'Your favorite shortcuts.', icon: LayoutGrid, component: AppsWidget },
  'smart-home': { title: 'Smart Home', description: 'Scenes and pinned devices.', icon: Lightbulb, component: SmartHomeWidget },
  'now-playing': { title: 'Now Playing', description: 'Halo’s own audio player.', icon: Music, component: () => <NowPlayingCard compact /> },
  reminders: { title: 'Reminders', description: 'A simple to-do list stored on this device.', icon: ListTodo, component: RemindersWidget },
  calendar: { title: 'Calendar', description: 'Month view with reminder due dates.', icon: CalendarDays, component: CalendarWidget },
  notes: { title: 'Notes', description: 'A quick scratchpad.', icon: StickyNote, component: NotesWidget },
  'quick-actions': { title: 'Quick Actions', description: 'Common actions in one tap.', icon: Zap, component: QuickActionsWidget },
  news: { title: 'Hacker News', description: 'Top stories from the public Hacker News API (needs a connection).', icon: Newspaper, component: NewsWidget },
}
