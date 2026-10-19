/**
 * Smart-home domain model and provider contract. The UI only talks to a
 * SmartHomeProvider, so a real bridge (e.g. a self-hosted Home Assistant
 * proxy) can be added later without touching components.
 */

export type ThermostatMode = 'off' | 'heat' | 'cool' | 'auto'
export type SensorKind = 'temperature' | 'humidity' | 'motion' | 'contact'

interface DeviceBase {
  id: string
  name: string
  roomId: string
  favorite: boolean
}

export interface LightDevice extends DeviceBase {
  type: 'light'
  on: boolean
  /** 1–100 */
  brightness: number
  dimmable: boolean
}

export interface SwitchDevice extends DeviceBase {
  type: 'switch'
  on: boolean
  /** Simulated or reported draw in watts while on */
  watts?: number
}

export interface ThermostatDevice extends DeviceBase {
  type: 'thermostat'
  mode: ThermostatMode
  /** °C */
  target: number
  /** °C */
  current: number
}

export interface LockDevice extends DeviceBase {
  type: 'lock'
  locked: boolean
}

export interface SensorDevice extends DeviceBase {
  type: 'sensor'
  kind: SensorKind
  /** °C, %, or 0/1 for motion and contact (1 = motion / open) */
  value: number
}

export interface CameraDevice extends DeviceBase {
  type: 'camera'
  /** Whether the camera is recording/armed */
  on: boolean
}

export type Device = LightDevice | SwitchDevice | ThermostatDevice | LockDevice | SensorDevice | CameraDevice
export type DeviceType = Device['type']

/** Fields a user can change on each device type */
export type DevicePatch =
  | Partial<Pick<LightDevice, 'on' | 'brightness'>>
  | Partial<Pick<ThermostatDevice, 'mode' | 'target'>>
  | Partial<Pick<LockDevice, 'locked'>>
  | Partial<Pick<DeviceBase, 'favorite'>>

export interface Room {
  id: string
  name: string
  icon: string
}

export interface SceneAction {
  deviceId: string
  patch: DevicePatch
}

export interface Scene {
  id: string
  name: string
  icon: string
  /** Either explicit actions, or "every light off" */
  actions: SceneAction[] | 'all-lights-off'
}

export interface HomeSnapshot {
  rooms: Room[]
  devices: Device[]
  scenes: Scene[]
}

export interface SmartHomeProvider {
  readonly id: string
  readonly name: string
  /** True for the built-in demo. The UI labels simulated devices accordingly. */
  readonly simulated: boolean
  getSnapshot(): HomeSnapshot
  subscribe(listener: () => void): () => void
  updateDevice(id: string, patch: DevicePatch): void
  activateScene(id: string): void
  reset(): void
}
