import type { HomeSnapshot } from './types'

/** A fictional home used by demo mode. None of these devices exist. */
export function demoHome(): HomeSnapshot {
  return {
    rooms: [
      { id: 'living', name: 'Living Room', icon: 'sofa' },
      { id: 'kitchen', name: 'Kitchen', icon: 'utensils' },
      { id: 'bedroom', name: 'Bedroom', icon: 'bed' },
      { id: 'office', name: 'Office', icon: 'monitor' },
      { id: 'entry', name: 'Entryway', icon: 'door' },
    ],
    devices: [
      { id: 'l-living-ceiling', type: 'light', name: 'Ceiling Light', roomId: 'living', on: true, brightness: 80, dimmable: true, favorite: true },
      { id: 'l-living-lamp', type: 'light', name: 'Floor Lamp', roomId: 'living', on: false, brightness: 45, dimmable: true, favorite: false },
      { id: 'p-living-tv', type: 'switch', name: 'TV Plug', roomId: 'living', on: true, watts: 85, favorite: false },
      { id: 't-living', type: 'thermostat', name: 'Thermostat', roomId: 'living', mode: 'heat', target: 21, current: 19.5, favorite: true },
      { id: 'l-kitchen', type: 'light', name: 'Pendants', roomId: 'kitchen', on: false, brightness: 100, dimmable: true, favorite: false },
      { id: 'p-kitchen-kettle', type: 'switch', name: 'Kettle', roomId: 'kitchen', on: false, watts: 2200, favorite: false },
      { id: 's-kitchen-humidity', type: 'sensor', name: 'Humidity', roomId: 'kitchen', kind: 'humidity', value: 48, favorite: false },
      { id: 'l-bedroom', type: 'light', name: 'Bedside Lamp', roomId: 'bedroom', on: false, brightness: 30, dimmable: true, favorite: true },
      { id: 's-bedroom-temp', type: 'sensor', name: 'Temperature', roomId: 'bedroom', kind: 'temperature', value: 19.8, favorite: false },
      { id: 'l-office', type: 'light', name: 'Desk Light', roomId: 'office', on: true, brightness: 65, dimmable: true, favorite: false },
      { id: 'p-office-fan', type: 'switch', name: 'Fan', roomId: 'office', on: false, watts: 40, favorite: false },
      { id: 's-office-motion', type: 'sensor', name: 'Motion', roomId: 'office', kind: 'motion', value: 0, favorite: false },
      { id: 'k-entry', type: 'lock', name: 'Front Door', roomId: 'entry', locked: true, favorite: true },
      { id: 's-entry-contact', type: 'sensor', name: 'Door Sensor', roomId: 'entry', kind: 'contact', value: 0, favorite: false },
      { id: 'c-entry', type: 'camera', name: 'Doorbell Camera', roomId: 'entry', on: true, favorite: false },
      { id: 'l-entry', type: 'light', name: 'Porch Light', roomId: 'entry', on: false, brightness: 100, dimmable: false, favorite: false },
    ],
    scenes: [
      {
        id: 'good-morning',
        name: 'Good Morning',
        icon: 'sunrise',
        actions: [
          { deviceId: 'l-bedroom', patch: { on: true, brightness: 60 } },
          { deviceId: 'l-kitchen', patch: { on: true, brightness: 100 } },
          { deviceId: 't-living', patch: { mode: 'heat', target: 21 } },
        ],
      },
      {
        id: 'good-night',
        name: 'Good Night',
        icon: 'moon',
        actions: [
          { deviceId: 'l-living-ceiling', patch: { on: false } },
          { deviceId: 'l-living-lamp', patch: { on: false } },
          { deviceId: 'l-kitchen', patch: { on: false } },
          { deviceId: 'l-office', patch: { on: false } },
          { deviceId: 'l-bedroom', patch: { on: true, brightness: 10 } },
          { deviceId: 'k-entry', patch: { locked: true } },
          { deviceId: 't-living', patch: { target: 18 } },
        ],
      },
      {
        id: 'away',
        name: 'Away',
        icon: 'plane',
        actions: [
          { deviceId: 'l-living-ceiling', patch: { on: false } },
          { deviceId: 'l-living-lamp', patch: { on: false } },
          { deviceId: 'l-kitchen', patch: { on: false } },
          { deviceId: 'l-bedroom', patch: { on: false } },
          { deviceId: 'l-office', patch: { on: false } },
          { deviceId: 'l-entry', patch: { on: true } },
          { deviceId: 'k-entry', patch: { locked: true } },
          { deviceId: 't-living', patch: { mode: 'auto', target: 16 } },
        ],
      },
      {
        id: 'movie-time',
        name: 'Movie Time',
        icon: 'clapperboard',
        actions: [
          { deviceId: 'l-living-ceiling', patch: { on: false } },
          { deviceId: 'l-living-lamp', patch: { on: true, brightness: 20 } },
          { deviceId: 'p-living-tv', patch: { on: true } },
        ],
      },
      { id: 'all-off', name: 'All Lights Off', icon: 'power', actions: 'all-lights-off' },
    ],
  }
}
