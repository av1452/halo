import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, ImagePlus } from 'lucide-react'
import { Button } from '../../components/Button'
import { Page } from '../../components/Page'
import { SegmentedControl } from '../../components/SegmentedControl'
import { showToast } from '../../components/toastStore'
import { Toggle } from '../../components/Toggle'
import { removeCustomWallpaper, saveCustomWallpaper, useCustomWallpaperUrl } from '../../design-system/customWallpaper'
import { ACCENTS, CUSTOM_WALLPAPER, WALLPAPERS, type Appearance, type GlassIntensity } from '../../design-system/theme'
import { themeStore, updateTheme } from '../../design-system/themeStore'
import { smartHome } from '../../integrations/smart-home'
import { DataSection } from './DataSection'
import { preferencesStore, updatePreferences, type TemperatureUnit } from './preferencesStore'
import { SettingsGroup, SettingsRow } from './SettingsList'
import styles from './settings.module.css'

const APPEARANCES = [
  { value: 'system', label: 'Automatic' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: Appearance; label: string }[]

const GLASS = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'vivid', label: 'Vivid' },
] as const satisfies readonly { value: GlassIntensity; label: string }[]

const UNITS = [
  { value: 'celsius', label: '°C' },
  { value: 'fahrenheit', label: '°F' },
] as const satisfies readonly { value: TemperatureUnit; label: string }[]

const EXTERNAL_SERVICES = [
  { name: 'Open-Meteo', when: 'Only after you set a weather location', sends: 'Coordinates rounded to ~100 m' },
  { name: 'Apple App Store (iTunes Search API)', when: 'When you open a Discover listing or search the App Store', sends: 'The app ID or your search term, and your region' },
  { name: 'Hacker News API', when: 'Only if you add the Hacker News widget', sends: 'Nothing personal' },
  { name: 'Apple image servers', when: 'When Discover shows app icons or screenshots', sends: 'Standard image requests, without a referrer' },
]

function WallpaperPicker() {
  const theme = themeStore.use()
  const input = useRef<HTMLInputElement>(null)
  const photoUrl = useCustomWallpaperUrl(theme.wallpaper === CUSTOM_WALLPAPER)

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      await saveCustomWallpaper(file)
      updateTheme({ wallpaper: CUSTOM_WALLPAPER })
    } catch (e) {
      showToast({ tone: 'warning', message: e instanceof Error ? e.message : 'Couldn’t save that image.' })
    }
  }

  return (
    <div className={styles.wallpapers} role="radiogroup" aria-label="Wallpaper">
      {WALLPAPERS.map((w) => (
        <button
          key={w.id}
          type="button"
          role="radio"
          aria-checked={theme.wallpaper === w.id}
          aria-label={w.name}
          className={styles.wallpaper}
          style={{ background: theme.appearance === 'dark' ? w.dark : w.light }}
          onClick={() => updateTheme({ wallpaper: w.id })}
        >
          {theme.wallpaper === w.id && <Check className={styles.wallpaperCheck} aria-hidden="true" />}
          <span className={styles.wallpaperName}>{w.name}</span>
        </button>
      ))}
      <button
        type="button"
        role="radio"
        aria-checked={theme.wallpaper === CUSTOM_WALLPAPER}
        aria-label="Photo from this device"
        className={`${styles.wallpaper} ${photoUrl ? '' : styles.wallpaperUpload}`}
        style={photoUrl ? { background: `url("${photoUrl}") center / cover` } : undefined}
        onClick={() => input.current?.click()}
      >
        {theme.wallpaper === CUSTOM_WALLPAPER ? <Check className={styles.wallpaperCheck} aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
        <span className={styles.wallpaperName}>{photoUrl ? 'Change' : 'Photo'}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {theme.wallpaper === CUSTOM_WALLPAPER && (
        <Button size="sm" variant="plain" onClick={() => { updateTheme({ wallpaper: WALLPAPERS[0].id }); void removeCustomWallpaper() }}>
          Remove photo
        </Button>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const theme = themeStore.use()
  const prefs = preferencesStore.use()
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) // Optional call: scrollIntoView is missing in some older engines (and jsdom)
    document.getElementById(hash.slice(1))?.scrollIntoView?.({ block: 'start' })
  }, [hash])

  return (
    <Page title="Settings">
      <div className={styles.columns}>
        <div className={styles.column}>
          <SettingsGroup title="Profile" footer="Used only for the greeting on Home. Stored on this device.">
            <SettingsRow
              label={<label htmlFor="display-name">Your name</label>}
              control={
                <input
                  id="display-name"
                  className={styles.textInput}
                  placeholder="Optional"
                  value={prefs.displayName}
                  maxLength={40}
                  autoComplete="given-name"
                  onChange={(e) => updatePreferences({ displayName: e.target.value })}
                />
              }
            />
          </SettingsGroup>

          <SettingsGroup id="appearance" title="Appearance">
            <SettingsRow label="Theme" stacked control={<SegmentedControl label="Theme" options={APPEARANCES} value={theme.appearance} onChange={(appearance) => updateTheme({ appearance })} />} />
            <SettingsRow
              label="Accent color"
              stacked
              control={
                <div className={styles.accents} role="radiogroup" aria-label="Accent color">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="radio"
                      aria-checked={theme.accent === a.id}
                      aria-label={a.name}
                      title={a.name}
                      className={styles.accent}
                      style={{ background: a.hex }}
                      onClick={() => updateTheme({ accent: a.id })}
                    >
                      {theme.accent === a.id && <Check size={16} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              }
            />
            <SettingsRow label="Wallpaper" stacked control={<WallpaperPicker />} />
            <SettingsRow
              label="Glass"
              description="How much of the wallpaper shows through panels."
              stacked
              control={<SegmentedControl label="Glass intensity" options={GLASS} value={theme.glass} onChange={(glass) => updateTheme({ glass })} />}
            />
          </SettingsGroup>

          <SettingsGroup id="accessibility" title="Accessibility" footer="Halo also follows the matching system settings automatically.">
            <SettingsRow label="Reduce motion" control={<Toggle checked={theme.reduceMotion} label="Reduce motion" onChange={(reduceMotion) => updateTheme({ reduceMotion })} />} />
            <SettingsRow label="Reduce transparency" description="Use solid panels instead of glass." control={<Toggle checked={theme.reduceTransparency} label="Reduce transparency" onChange={(reduceTransparency) => updateTheme({ reduceTransparency })} />} />
            <SettingsRow label="Increase contrast" control={<Toggle checked={theme.increaseContrast} label="Increase contrast" onChange={(increaseContrast) => updateTheme({ increaseContrast })} />} />
          </SettingsGroup>
        </div>

        <div className={styles.column}>
          <SettingsGroup title="General">
            <SettingsRow label="Open links in a new tab" description="Keeps Halo open behind websites you launch." control={<Toggle checked={prefs.openLinksInNewTab} label="Open links in a new tab" onChange={(openLinksInNewTab) => updatePreferences({ openLinksInNewTab })} />} />
            <SettingsRow label="Temperature" control={<SegmentedControl label="Temperature unit" options={UNITS} value={prefs.temperatureUnit} onChange={(temperatureUnit) => updatePreferences({ temperatureUnit })} />} />
            <SettingsRow label="24-hour time" control={<Toggle checked={prefs.use24HourClock} label="24-hour time" onChange={(use24HourClock) => updatePreferences({ use24HourClock })} />} />
          </SettingsGroup>

          <SettingsGroup title="Layout & Content">
            <SettingsRow label="Home dashboard" description="Add, remove and arrange widgets." control={<Link to="/" className={styles.rowLink}>Edit on Home</Link>} />
            <SettingsRow label="Apps & folders" description="Shortcuts, favorites and folders." control={<Link to="/apps" className={styles.rowLink}>Manage</Link>} />
            <SettingsRow
              label="Smart Home"
              description={smartHome.simulated ? 'Demo mode: simulated devices only. No real integration is connected.' : `Connected: ${smartHome.name}`}
              control={<Link to="/smart-home" className={styles.rowLink}>Open</Link>}
            />
          </SettingsGroup>

          <DataSection />

          <SettingsGroup id="privacy" title="Privacy" footer="Halo has no accounts, analytics or tracking, and never stores passwords. Everything else stays in this browser.">
            {EXTERNAL_SERVICES.map((s) => (
              <SettingsRow key={s.name} label={s.name} description={`${s.when}. Receives: ${s.sends}.`} />
            ))}
          </SettingsGroup>

          <SettingsGroup id="about" title="About">
            <SettingsRow label="Halo" description="Your digital world, beautifully unified." control={<span className={styles.version}>Version {__APP_VERSION__}</span>} />
            <SettingsRow label="Independent project" description="Halo isn’t affiliated with or endorsed by Apple. It’s a web app and can’t replace the iOS Home Screen or access native-only features." />
          </SettingsGroup>
        </div>
      </div>
    </Page>
  )
}
