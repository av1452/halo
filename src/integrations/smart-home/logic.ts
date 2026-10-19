/** Provider-neutral smart-home state logic. */
import { clamp, isBoolean, isNumber, isOneOf } from '../../utils/guards'
import type { Device, DevicePatch, Scene } from './types'

export const TARGET_MIN = 10
export const TARGET_MAX = 30

const isMode = isOneOf(['off', 'heat', 'cool', 'auto'] as const)

/** Applies only the fields that make sense for this device type. */
export function applyPatch(device: Device, patch: DevicePatch): Device {
  const p = patch as Record<string, unknown>
  const favorite = isBoolean(p.favorite) ? p.favorite : device.favorite
  switch (device.type) {
    case 'light':
      return {
        ...device,
        favorite,
        on: isBoolean(p.on) ? p.on : device.on,
        brightness: isNumber(p.brightness) && device.dimmable ? Math.round(clamp(p.brightness, 1, 100)) : device.brightness,
      }
    case 'switch':
    case 'camera':
      return { ...device, favorite, on: isBoolean(p.on) ? p.on : device.on }
    case 'thermostat':
      return {
        ...device,
        favorite,
        mode: isMode(p.mode) ? p.mode : device.mode,
        target: isNumber(p.target) ? clamp(Math.round(p.target * 2) / 2, TARGET_MIN, TARGET_MAX) : device.target,
      }
    case 'lock':
      return { ...device, favorite, locked: isBoolean(p.locked) ? p.locked : device.locked }
    case 'sensor':
      return { ...device, favorite }
  }
}

export function applyScene(devices: Device[], scene: Scene): Device[] {
  if (scene.actions === 'all-lights-off') {
    return devices.map((d) => (d.type === 'light' ? applyPatch(d, { on: false }) : d))
  }
  const byId = new Map(scene.actions.map((a) => [a.deviceId, a.patch]))
  return devices.map((d) => (byId.has(d.id) ? applyPatch(d, byId.get(d.id)!) : d))
}

/** True when every action in the scene already matches the current state. */
export function isSceneActive(devices: Device[], scene: Scene): boolean {
  const after = applyScene(devices, scene)
  return after.every((d, i) => JSON.stringify(d) === JSON.stringify(devices[i]))
}

/**
 * One simulation step: thermostats drift toward their target and the motion
 * sensor occasionally trips. `random` is injectable for tests.
 */
export function simulateStep(devices: Device[], random: () => number = Math.random): Device[] {
  return devices.map((d) => {
    if (d.type === 'thermostat' && d.mode !== 'off') {
      const diff = d.target - d.current
      const canHeat = d.mode === 'heat' || d.mode === 'auto'
      const canCool = d.mode === 'cool' || d.mode === 'auto'
      if ((diff > 0 && canHeat) || (diff < 0 && canCool)) {
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 0.1)
        return { ...d, current: Math.round((d.current + step) * 10) / 10 }
      }
    }
    if (d.type === 'sensor' && d.kind === 'motion') {
      return { ...d, value: random() < 0.15 ? 1 : 0 }
    }
    return d
  })
}
