import { useState } from 'react'
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, MapPin, RefreshCw, Sun, type LucideIcon } from 'lucide-react'
import { Button, IconButton } from '../../../components/Button'
import { describeWeather } from '../../../services/weather'
import { formatTemp } from '../../../utils/format'
import { preferencesStore } from '../../settings/preferencesStore'
import { PlaceSheet } from './PlaceSheet'
import { useWeather } from './useWeather'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

const ICONS: Record<ReturnType<typeof describeWeather>['icon'], LucideIcon> = {
  sun: Sun, 'cloud-sun': CloudSun, cloud: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, snow: CloudSnow, storm: CloudLightning,
}

export function WeatherWidget() {
  const { place, report, loading, error, refresh } = useWeather()
  const { temperatureUnit } = preferencesStore.use()
  const [picking, setPicking] = useState(false)
  const description = report ? describeWeather(report.code) : null
  const Icon = description ? ICONS[description.icon] : CloudSun

  return (
    <WidgetFrame
      title="Weather"
      icon={CloudSun}
      action={place && <IconButton label="Refresh weather" icon={<RefreshCw className={loading ? styles.spin : ''} />} variant="plain" size="sm" onClick={refresh} disabled={loading} />}
    >
      {!place ? (
        <div className={styles.setup}>
          <p className={styles.muted}>Choose a location to see live weather. Halo doesn’t show weather until you do.</p>
          <Button size="sm" variant="primary" icon={<MapPin size={16} />} onClick={() => setPicking(true)}>Set location</Button>
        </div>
      ) : (
        <>
          <button type="button" className={styles.placeName} onClick={() => setPicking(true)} aria-label={`Change weather location, currently ${place.name}`}>
            <MapPin size={14} aria-hidden="true" /> {place.name}
          </button>
          {report && description ? (
            <div className={styles.weatherNow}>
              <Icon className={styles.weatherIcon} aria-hidden="true" />
              <div>
                <p className={styles.bigTemp}>{formatTemp(report.temperature, temperatureUnit)}</p>
                <p className={styles.muted}>
                  {description.label} · H {formatTemp(report.high, temperatureUnit)} L {formatTemp(report.low, temperatureUnit)}
                </p>
              </div>
            </div>
          ) : (
            !error && <p className={styles.muted}>Loading…</p>
          )}
          {error && <p className={styles.error} role="alert">{error}{report && ' Showing the last update.'}</p>}
          {report && (
            <p className={styles.fineprint}>
              Updated {new Date(report.fetchedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · Open-Meteo
            </p>
          )}
        </>
      )}
      {picking && <PlaceSheet open onClose={() => setPicking(false)} />}
    </WidgetFrame>
  )
}
