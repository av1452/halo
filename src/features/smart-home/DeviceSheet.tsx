import { Minus, Plus, Sun, VideoOff } from 'lucide-react'
import { Button, IconButton } from '../../components/Button'
import { DemoBadge } from '../../components/DemoBadge'
import { SegmentedControl } from '../../components/SegmentedControl'
import { Sheet } from '../../components/Sheet'
import { Slider } from '../../components/Slider'
import { Toggle } from '../../components/Toggle'
import { smartHome, TARGET_MAX, TARGET_MIN, useSmartHome, type Device, type ThermostatDevice, type ThermostatMode } from '../../integrations/smart-home'
import { formatTemp } from '../../utils/format'
import { preferencesStore } from '../settings/preferencesStore'
import { DeviceIcon, deviceStatus } from './describe'
import styles from './smartHome.module.css'

const MODES = [
  { value: 'off', label: 'Off' },
  { value: 'heat', label: 'Heat' },
  { value: 'cool', label: 'Cool' },
  { value: 'auto', label: 'Auto' },
] as const satisfies readonly { value: ThermostatMode; label: string }[]

function ThermostatControls({ device }: { device: ThermostatDevice }) {
  const { temperatureUnit } = preferencesStore.use()
  const step = (delta: number) => smartHome.updateDevice(device.id, { target: device.target + delta })
  return (
    <div className={styles.thermostat}>
      <p className={styles.bigReading} aria-live="polite">
        {formatTemp(device.current, temperatureUnit, 1)}
        <span className={styles.readingLabel}>Current</span>
      </p>
      <div className={styles.targetRow}>
        <IconButton label="Lower target temperature" icon={<Minus />} variant="filled" size="lg" disabled={device.target <= TARGET_MIN} onClick={() => step(-0.5)} />
        <p className={styles.target}>
          <span className={styles.readingLabel}>Target</span>
          <span aria-live="polite">{formatTemp(device.target, temperatureUnit, temperatureUnit === 'celsius' ? 1 : 0)}</span>
        </p>
        <IconButton label="Raise target temperature" icon={<Plus />} variant="filled" size="lg" disabled={device.target >= TARGET_MAX} onClick={() => step(0.5)} />
      </div>
      <SegmentedControl label="Mode" options={MODES} value={device.mode} onChange={(mode) => smartHome.updateDevice(device.id, { mode })} />
    </div>
  )
}

function Controls({ device }: { device: Device }) {
  switch (device.type) {
    case 'light':
      return (
        <>
          <div className={styles.controlRow}>
            <span>Power</span>
            <Toggle checked={device.on} label={`${device.name} power`} onChange={(on) => smartHome.updateDevice(device.id, { on })} />
          </div>
          {device.dimmable && (
            <Slider
              label={`${device.name} brightness`}
              icon={<Sun size={18} />}
              min={1}
              max={100}
              value={device.brightness}
              formatValue={(v) => `${v}%`}
              onChange={(brightness) => smartHome.updateDevice(device.id, { brightness, on: true })}
            />
          )}
        </>
      )
    case 'switch':
      return (
        <div className={styles.controlRow}>
          <span>Power{device.on && device.watts ? ` · ${device.watts} W` : ''}</span>
          <Toggle checked={device.on} label={`${device.name} power`} onChange={(on) => smartHome.updateDevice(device.id, { on })} />
        </div>
      )
    case 'camera':
      return (
        <>
          <div className={styles.cameraPlaceholder}>
            <VideoOff aria-hidden="true" />
            <p>No video feed. Demo cameras don’t stream; a real integration would show a live or snapshot view here.</p>
          </div>
          <div className={styles.controlRow}>
            <span>Armed</span>
            <Toggle checked={device.on} label={`${device.name} armed`} onChange={(on) => smartHome.updateDevice(device.id, { on })} />
          </div>
        </>
      )
    case 'thermostat':
      return <ThermostatControls device={device} />
    case 'lock':
      return (
        <Button variant={device.locked ? 'secondary' : 'primary'} onClick={() => smartHome.updateDevice(device.id, { locked: !device.locked })}>
          {device.locked ? 'Unlock' : 'Lock'}
        </Button>
      )
    case 'sensor':
      return <p className={styles.note}>This sensor is read-only.</p>
  }
}

export function DeviceSheet({ deviceId, onClose }: { deviceId: string | null; onClose: () => void }) {
  const { devices, rooms } = useSmartHome()
  const { temperatureUnit } = preferencesStore.use()
  const device = devices.find((d) => d.id === deviceId)
  if (!device) return null
  const room = rooms.find((r) => r.id === device.roomId)

  return (
    <Sheet open title={device.name} onClose={onClose}>
      <div className={styles.sheet}>
        <div className={styles.sheetHead}>
          <span className={styles.sheetIcon} aria-hidden="true"><DeviceIcon device={device} /></span>
          <div>
            <p className={styles.sheetStatus}>{deviceStatus(device, temperatureUnit)}</p>
            <p className={styles.sheetRoom}>{room?.name}</p>
          </div>
          {smartHome.simulated && <DemoBadge label="Simulated" />}
        </div>
        <Controls device={device} />
        <div className={styles.controlRow}>
          <span>Show on Home dashboard</span>
          <Toggle checked={device.favorite} label="Show on Home dashboard" onChange={(favorite) => smartHome.updateDevice(device.id, { favorite })} />
        </div>
      </div>
    </Sheet>
  )
}
