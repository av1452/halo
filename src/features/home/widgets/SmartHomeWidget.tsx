import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoBadge } from '../../../components/DemoBadge'
import { smartHome, useSmartHome } from '../../../integrations/smart-home'
import { DeviceSheet } from '../../smart-home/DeviceSheet'
import { DeviceTile } from '../../smart-home/DeviceTile'
import { SceneButton } from '../../smart-home/SceneButton'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function SmartHomeWidget() {
  const { devices, rooms, scenes } = useSmartHome()
  const [open, setOpen] = useState<string | null>(null)
  const favorites = devices.filter((d) => d.favorite).slice(0, 6)
  return (
    <WidgetFrame
      title="Smart Home"
      icon={Lightbulb}
      badge={smartHome.simulated ? <DemoBadge /> : undefined}
      action={<Link to="/smart-home" className={styles.link}>All devices</Link>}
    >
      <div className={styles.sceneRow}>
        {scenes.slice(0, 4).map((s) => <SceneButton key={s.id} scene={s} devices={devices} />)}
      </div>
      {favorites.length > 0 ? (
        <ul className={styles.deviceGrid} aria-label="Pinned devices">
          {favorites.map((d) => (
            <DeviceTile key={d.id} device={d} roomName={rooms.find((r) => r.id === d.roomId)?.name} onOpen={(x) => setOpen(x.id)} />
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>Pin devices from Smart Home to show them here.</p>
      )}
      <DeviceSheet deviceId={open} onClose={() => setOpen(null)} />
    </WidgetFrame>
  )
}
