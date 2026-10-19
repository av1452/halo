import { Compass, House, LayoutGrid, Lightbulb, Music, Settings, type LucideIcon } from 'lucide-react'

export interface Section {
  id: 'home' | 'apps' | 'smart-home' | 'media' | 'discover' | 'settings'
  path: string
  label: string
  icon: LucideIcon
}

export const SECTIONS: readonly Section[] = [
  { id: 'home', path: '/', label: 'Home', icon: House },
  { id: 'apps', path: '/apps', label: 'Apps', icon: LayoutGrid },
  { id: 'smart-home', path: '/smart-home', label: 'Smart Home', icon: Lightbulb },
  { id: 'media', path: '/media', label: 'Media', icon: Music },
  { id: 'discover', path: '/discover', label: 'Discover', icon: Compass },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
]
