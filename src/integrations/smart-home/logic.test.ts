import { demoHome } from './demoData'
import { validateDemoDevices } from './demoProvider'
import { applyPatch, applyScene, isSceneActive, simulateStep } from './logic'
import type { LightDevice, ThermostatDevice } from './types'

const { devices, scenes } = demoHome()
const light = devices.find((d) => d.id === 'l-living-lamp') as LightDevice
const thermostat = devices.find((d) => d.type === 'thermostat') as ThermostatDevice

describe('smart-home logic', () => {
  it('only applies fields that belong to the device type and clamps values', () => {
    expect(applyPatch(light, { brightness: 500 })).toMatchObject({ brightness: 100 })
    expect(applyPatch(light, { locked: true } as never)).toEqual(light)
    expect(applyPatch(thermostat, { target: 99 })).toMatchObject({ target: 30 })
    expect(applyPatch(thermostat, { target: 21.3 })).toMatchObject({ target: 21.5 })
  })

  it('applies scenes and detects when a scene is already active', () => {
    const allOff = scenes.find((s) => s.id === 'all-off')!
    const after = applyScene(devices, allOff)
    expect(after.filter((d) => d.type === 'light').every((d) => d.type === 'light' && !d.on)).toBe(true)
    expect(isSceneActive(devices, allOff)).toBe(false)
    expect(isSceneActive(after, allOff)).toBe(true)
  })

  it('drifts a heating thermostat toward its target and stops there', () => {
    let state = [{ ...thermostat, current: 20.8, target: 21, mode: 'heat' as const }]
    state = simulateStep(state) as typeof state
    expect(state[0].current).toBe(20.9)
    state = simulateStep(simulateStep(state)) as typeof state
    expect(state[0].current).toBe(21)
  })

  it('does not heat when set to cool', () => {
    const state = simulateStep([{ ...thermostat, current: 18, target: 21, mode: 'cool' }])
    expect((state[0] as ThermostatDevice).current).toBe(18)
  })

  it('restores saved state and ignores unknown or malformed devices', () => {
    const restored = validateDemoDevices([{ id: 'l-living-lamp', on: true, brightness: 'x' }, { id: 'ghost', on: true }, 'junk'])
    expect(restored).toHaveLength(devices.length)
    expect(restored?.find((d) => d.id === 'l-living-lamp')).toMatchObject({ on: true, brightness: light.brightness })
  })
})
