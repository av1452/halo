import { Download, PlusSquare, Share } from 'lucide-react'
import { Button } from '../../components/Button'
import { useInstallState } from '../../pwa/useInstallState'
import { SettingsGroup, SettingsRow } from './SettingsList'
import styles from './settings.module.css'

export function InstallSection() {
  const { standalone, appleMobile, canPrompt, prompt, offlineReady } = useInstallState()
  return (
    <SettingsGroup
      id="install"
      title="Install Halo"
      footer="Installing adds Halo to your Home Screen and opens it in its own window. It doesn’t grant extra permissions or replace your Home Screen."
    >
      {standalone ? (
        <SettingsRow label="Halo is installed" description="You’re using Halo as an installed app." />
      ) : (
        <>
          {canPrompt && (
            <SettingsRow
              label="Install on this device"
              control={<Button size="sm" variant="primary" icon={<Download size={16} />} onClick={() => void prompt()}>Install</Button>}
            />
          )}
          <SettingsRow
            label="iPhone and iPad"
            description={
              <ol className={styles.steps}>
                <li>Open Halo in Safari{appleMobile ? '' : ' on your iPhone or iPad'}.</li>
                <li>Tap <Share size={14} aria-label="Share" className={styles.inlineIcon} /> Share (you may need to tap ••• first).</li>
                <li>Choose <PlusSquare size={14} aria-hidden="true" className={styles.inlineIcon} /> Add to Home Screen, then Add.</li>
              </ol>
            }
            stacked
          />
          {!appleMobile && !canPrompt && (
            <SettingsRow label="Other browsers" description="In Chrome or Edge, use the install icon in the address bar or the browser menu’s “Install” option. Some browsers don’t support installing web apps." />
          )}
        </>
      )}
      <SettingsRow
        label="Offline use"
        description={offlineReady ? 'Supported. After your first visit, Halo opens without a connection; live weather, App Store and news need a network.' : 'Not available in this browser or connection, so Halo needs a network.'}
      />
    </SettingsGroup>
  )
}
