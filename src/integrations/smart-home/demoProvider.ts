import { createPersistedStore } from '../../storage/persistedStore'
import { clamp, isNumber, isRecord } from '../../utils/guards'
import { demoHome } from './demoData'
import { applyPatch, applyScene, simulateStep } from './logic'
import type { Device, DevicePatch, HomeSnapshot, SmartHomeProvider } from './types'

/** Restores saved state onto the current demo devices, ignoring anything unknown. */
export function validateDemoDevices(raw: unknown): Device[] | null {
  if (!Array.isArray(raw)) return null
  const saved = new Map(raw.filter(isRecord).map((r) => [r.id, r]))
  return demoHome().devices.map((device) => {
    const s = saved.get(device.id)
    if (!s) return device
    let next = applyPatch(device, s as DevicePatch)
    if (next.type === 'thermostat' && isNumber(s.current)) next = { ...next, current: clamp(s.current, 0, 40) }
    if (next.type === 'sensor' && isNumber(s.value)) next = { ...next, value: s.value }
    return next
  })
}

const devicesStore = createPersistedStore<Device[]>({
  key: 'smart-home-demo',
  version: 1,
  defaults: () => demoHome().devices,
  validate: validateDemoDevices,
})

const { rooms, scenes } = demoHome()
let snapshot: HomeSnapshot = { rooms, scenes, devices: devicesStore.get() }
devicesStore.subscribe(() => {
  snapshot = { rooms, scenes, devices: devicesStore.get() }
})

export const demoProvider: SmartHomeProvider & { tick: (random?: () => number) => void } = {
  id: 'demo',
  name: 'Demo Home',
  simulated: true,
  getSnapshot: () => snapshot,
  subscribe: (listener) => devicesStore.subscribe(listener),
  updateDevice(id, patch) {
    devicesStore.set((devices) => devices.map((d) => (d.id === id ? applyPatch(d, patch) : d)))
  },
  activateScene(id) {
    const scene = scenes.find((s) => s.id === id)
    if (scene) devicesStore.set((devices) => applyScene(devices, scene))
  },
  reset: () => devicesStore.reset(),
  tick(random) {
    devicesStore.set((devices) => simulateStep(devices, random))
  },
}
