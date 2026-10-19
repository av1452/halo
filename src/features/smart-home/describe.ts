import { createElement } from 'react'
import {
  Bed, Camera, Clapperboard, DoorClosed, Droplets, Fan, Lamp, Lightbulb, Lock, LockOpen, Monitor, Moon, Plane,
  Plug, Power, Sofa, Sunrise, Thermometer, Activity, DoorOpen, Utensils, Home, type LucideIcon,
} from 'lucide-react'
import type { Device, DevicePatch } from '../../integrations/smart-home'
import type { TemperatureUnit } from '../settings/preferencesStore'
import { formatTemp } from '../../utils/format'

export const ROOM_ICONS: Record<string, LucideIcon> = { sofa: Sofa, utensils: Utensils, bed: Bed, monitor: Monitor, door: DoorClosed }
export const SCENE_ICONS: Record<string, LucideIcon> = { sunrise: Sunrise, moon: Moon, plane: Plane, clapperboard: Clapperboard, power: Power }
export const roomIcon = (key: string) => ROOM_ICONS[key] ?? Home

export function deviceIcon(d: Device): LucideIcon {
  switch (d.type) {
    case 'light':
      return d.name.toLowerCase().includes('lamp') ? Lamp : Lightbulb
    case 'switch':
      return d.name.toLowerCase().includes('fan') ? Fan : Plug
    case 'thermostat':
      return Thermometer
    case 'lock':
      return d.locked ? Lock : LockOpen
    case 'camera':
      return Camera
    case 'sensor':
      return { temperature: Thermometer, humidity: Droplets, motion: Activity, contact: d.value ? DoorOpen : DoorClosed }[d.kind]
  }
}

/** Renders the icon for a device's current state. */
export function DeviceIcon({ device, size }: { device: Device; size?: number }) {
  return createElement(deviceIcon(device), { size, 'aria-hidden': true })
}

/** Whether the tile should render in its "on/attention" style. */
export function isActive(d: Device): boolean {
  switch (d.type) {
    case 'light':
    case 'switch':
    case 'camera':
      return d.on
    case 'thermostat':
      return d.mode !== 'off'
    case 'lock':
      return !d.locked
    case 'sensor':
      return (d.kind === 'motion' || d.kind === 'contact') && d.value === 1
  }
}

export function deviceStatus(d: Device, unit: TemperatureUnit): string {
  switch (d.type) {
    case 'light':
      return d.on ? (d.dimmable ? `${d.brightness}%` : 'On') : 'Off'
    case 'switch':
      return d.on ? 'On' : 'Off'
    case 'camera':
      return d.on ? 'Armed' : 'Off'
    case 'thermostat':
      if (d.mode === 'off') return `Off · ${formatTemp(d.current, unit, 1)}`
      return `${modeLabel(d.mode)} to ${formatTemp(d.target, unit)} · ${formatTemp(d.current, unit, 1)}`
    case 'lock':
      return d.locked ? 'Locked' : 'Unlocked'
    case 'sensor':
      switch (d.kind) {
        case 'temperature':
          return formatTemp(d.value, unit, 1)
        case 'humidity':
          return `${Math.round(d.value)}%`
        case 'motion':
          return d.value ? 'Motion detected' : 'No motion'
        case 'contact':
          return d.value ? 'Open' : 'Closed'
      }
  }
}

export function modeLabel(mode: string) {
  return { off: 'Off', heat: 'Heating', cool: 'Cooling', auto: 'Auto' }[mode] ?? mode
}

/** Devices whose main tap action is a simple toggle. */
export function primaryToggle(d: Device): { label: string; patch: DevicePatch } | null {
  switch (d.type) {
    case 'light':
    case 'switch':
    case 'camera':
      return { label: d.on ? `Turn off ${d.name}` : `Turn on ${d.name}`, patch: { on: !d.on } }
    case 'lock':
      return { label: d.locked ? `Unlock ${d.name}` : `Lock ${d.name}`, patch: { locked: !d.locked } }
    default:
      return null
  }
}
