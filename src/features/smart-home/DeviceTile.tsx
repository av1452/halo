import { useId } from 'react'
import { ChevronRight } from 'lucide-react'
import { smartHome, type Device } from '../../integrations/smart-home'
import { preferencesStore } from '../settings/preferencesStore'
import { DeviceIcon, deviceStatus, isActive, primaryToggle } from './describe'
import styles from './smartHome.module.css'

interface DeviceTileProps {
  device: Device
  roomName?: string
  onOpen: (device: Device) => void
}

export function DeviceTile({ device, roomName, onOpen }: DeviceTileProps) {
  const { temperatureUnit } = preferencesStore.use()
  const statusId = useId()
  const active = isActive(device)
  const toggle = primaryToggle(device)
  const pressed = toggle && device.type !== 'lock' ? active : undefined

  return (
    <li className={`${active ? styles.tileActive : 'glass-thin'} ${styles.tile}`}>
      <button
        type="button"
        className={styles.tileMain}
        aria-pressed={pressed}
        aria-label={toggle && device.type === 'lock' ? toggle.label : device.name}
        aria-describedby={statusId}
        onClick={() => (toggle ? smartHome.updateDevice(device.id, toggle.patch) : onOpen(device))}
      >
        <span className={styles.tileIcon} aria-hidden="true">
          <DeviceIcon device={device} />
        </span>
        <span className={styles.tileText}>
          {roomName && <span className={styles.tileRoom}>{roomName}</span>}
          <span className={styles.tileName}>{device.name}</span>
          <span id={statusId} className={styles.tileStatus}>{deviceStatus(device, temperatureUnit)}</span>
        </span>
      </button>
      <button type="button" className={styles.tileMore} aria-label={`${device.name} controls`} onClick={() => onOpen(device)}>
        <ChevronRight size={16} />
      </button>
    </li>
  )
}
