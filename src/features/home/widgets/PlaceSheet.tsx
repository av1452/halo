import { useState, type FormEvent } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Sheet } from '../../../components/Sheet'
import { SearchField } from '../../../components/SearchField'
import { searchPlaces, WeatherError, type Place } from '../../../services/weather'
import { weatherStore } from '../widgetStores'
import styles from '../home.module.css'

export function PlaceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const choose = (place: Place) => {
    weatherStore.set({ place, cache: null })
    onClose()
  }

  const search = async (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setStatus('Searching…')
    try {
      const found = await searchPlaces(query)
      setResults(found)
      setStatus(found.length ? null : 'No places found.')
    } catch (err) {
      setStatus(err instanceof WeatherError ? err.message : 'Search failed.')
    }
  }

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setStatus('This browser can’t share your location. Search for a city instead.')
      return
    }
    setStatus('Waiting for location permission…')
    navigator.geolocation.getCurrentPosition(
      (pos) => choose({ name: 'Current location', latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'Location permission was denied. Search for a city instead.' : 'Couldn’t get your location.'),
      { maximumAge: 600_000, timeout: 15_000 },
    )
  }

  return (
    <Sheet open={open} title="Weather Location" onClose={onClose}>
      <div className={styles.placeSheet}>
        <p className={styles.muted}>
          Weather comes from Open-Meteo. Only the coordinates of the place you choose are sent to it, rounded to about 100 m.
        </p>
        <form onSubmit={search} className={styles.placeSearch}>
          <SearchField label="City name" placeholder="Search for a city" value={query} onChange={setQuery} data-autofocus />
          <Button type="submit" variant="primary">Search</Button>
        </form>
        <Button icon={<LocateFixed size={18} />} onClick={locate}>Use my current location</Button>
        {status && <p className={styles.muted} role="status">{status}</p>}
        {results && results.length > 0 && (
          <ul className={styles.placeList}>
            {results.map((p) => (
              <li key={`${p.latitude},${p.longitude}`}>
                <button type="button" onClick={() => choose(p)}>
                  <MapPin size={16} aria-hidden="true" />
                  <span>
                    <strong>{p.name}</strong>
                    {p.region && <span className={styles.muted}> · {p.region}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {weatherStore.get().place && (
          <Button variant="danger" onClick={() => { weatherStore.reset(); onClose() }}>Remove location</Button>
        )}
      </div>
    </Sheet>
  )
}
