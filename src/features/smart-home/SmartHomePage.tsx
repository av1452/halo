import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Info, Lightbulb, Lock, RotateCcw, Thermometer } from 'lucide-react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DemoBadge } from '../../components/DemoBadge'
import { FilterChips } from '../../components/FilterChips'
import { GlassCard } from '../../components/GlassCard'
import { Page, PageSection } from '../../components/Page'
import { smartHome, useDemoSimulation, useSmartHome } from '../../integrations/smart-home'
import { formatTemp } from '../../utils/format'
import { preferencesStore } from '../settings/preferencesStore'
import { DeviceSheet } from './DeviceSheet'
import { DeviceTile } from './DeviceTile'
import { SceneButton } from './SceneButton'
import styles from './smartHome.module.css'

export default function SmartHomePage() {
  useDemoSimulation()
  const { rooms, devices, scenes } = useSmartHome()
  const { temperatureUnit } = preferencesStore.use()
  const [params, setParams] = useSearchParams()
  const [confirmReset, setConfirmReset] = useState(false)
  // The open device lives in the URL so search results and Back work
  const openDevice = params.get('device')
  const setOpenDevice = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('device', id)
    else next.delete('device')
    setParams(next, { replace: true })
  }
  const roomFilter = rooms.some((r) => r.id === params.get('room')) ? params.get('room')! : 'all'

  const lightsOn = devices.filter((d) => d.type === 'light' && d.on).length
  const unlocked = devices.filter((d) => d.type === 'lock' && !d.locked).length
  const thermostat = devices.find((d) => d.type === 'thermostat')
  const visibleRooms = roomFilter === 'all' ? rooms : rooms.filter((r) => r.id === roomFilter)
  const favorites = devices.filter((d) => d.favorite)

  return (
    <Page
      title="Smart Home"
      subtitle={
        <span className={styles.subtitle}>
          {smartHome.name} {smartHome.simulated && <DemoBadge label="Demo mode" />}
        </span>
      }
    >
      {smartHome.simulated && (
        <GlassCard className={styles.banner} padding="md" role="note">
          <Info aria-hidden="true" className={styles.bannerIcon} />
          <p>
            You’re exploring a <strong>simulated home</strong>. These devices aren’t real and nothing in your home is
            controlled. Halo can’t access Apple Home (HomeKit) from the web; see Integrations below.
          </p>
        </GlassCard>
      )}

      <div className={styles.summary} aria-label="Home summary" role="group">
        <span className={`glass-thin ${styles.summaryChip}`}><Lightbulb size={16} aria-hidden="true" /> {lightsOn} light{lightsOn === 1 ? '' : 's'} on</span>
        <span className={`glass-thin ${styles.summaryChip}`}><Lock size={16} aria-hidden="true" /> {unlocked ? `${unlocked} unlocked` : 'All locked'}</span>
        {thermostat?.type === 'thermostat' && (
          <span className={`glass-thin ${styles.summaryChip}`}><Thermometer size={16} aria-hidden="true" /> {formatTemp(thermostat.current, temperatureUnit, 1)} inside</span>
        )}
      </div>

      <PageSection title="Scenes">
        <div className={styles.scenes}>
          {scenes.map((s) => <SceneButton key={s.id} scene={s} devices={devices} />)}
        </div>
      </PageSection>

      {favorites.length > 0 && roomFilter === 'all' && (
        <PageSection title="Favorites">
          <ul className={styles.devices} aria-label="Favorite devices">
            {favorites.map((d) => (
              <DeviceTile key={d.id} device={d} roomName={rooms.find((r) => r.id === d.roomId)?.name} onOpen={(x) => setOpenDevice(x.id)} />
            ))}
          </ul>
        </PageSection>
      )}

      <FilterChips
        label="Filter by room"
        value={roomFilter}
        options={[{ value: 'all', label: 'All Rooms' }, ...rooms.map((r) => ({ value: r.id, label: r.name }))]}
        onChange={(v) => setParams(v === 'all' ? {} : { room: v }, { replace: true })}
      />

      {visibleRooms.map((room) => (
        <PageSection key={room.id} title={room.name}>
          <ul className={styles.devices} aria-label={`${room.name} devices`}>
            {devices.filter((d) => d.roomId === room.id).map((d) => (
              <DeviceTile key={d.id} device={d} onOpen={(x) => setOpenDevice(x.id)} />
            ))}
          </ul>
        </PageSection>
      ))}

      <PageSection title="Integrations">
        <GlassCard padding="lg" className={styles.integrations}>
          <div className={styles.integration}>
            <div>
              <h3>Demo Home</h3>
              <p>Built-in simulation. Active.</p>
            </div>
            <Button size="sm" icon={<RotateCcw size={16} />} onClick={() => setConfirmReset(true)}>Reset demo</Button>
          </div>
          <div className={styles.integration}>
            <div>
              <h3>Apple Home (HomeKit)</h3>
              <p>Not available. HomeKit is a native-only framework that web apps can’t access. It would need a future native companion app.</p>
            </div>
          </div>
          <div className={styles.integration}>
            <div>
              <h3>Self-hosted bridge</h3>
              <p>
                Planned. Platforms like Home Assistant expose a documented web API, but connecting safely needs a server on
                your network, HTTPS and a token kept off this device’s public code. See the README for the design.
              </p>
            </div>
          </div>
        </GlassCard>
      </PageSection>

      <DeviceSheet deviceId={openDevice} onClose={() => setOpenDevice(null)} />
      <ConfirmDialog
        open={confirmReset}
        title="Reset the demo home?"
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          smartHome.reset()
          setConfirmReset(false)
        }}
      >
        All simulated devices return to their starting state.
      </ConfirmDialog>
    </Page>
  )
}
