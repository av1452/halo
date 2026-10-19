import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { showToast } from '../../components/toastStore'
import { removeCustomWallpaper } from '../../design-system/customWallpaper'
import { applyBackup, BackupError, createBackup, exportFileName, parseBackup, resetAllStores, type BackupFile } from '../../storage/backup'
import '../../storage/allStores'
import { SettingsGroup, SettingsRow } from './SettingsList'

const LABELS: Record<string, string> = {
  theme: 'Appearance',
  preferences: 'Preferences',
  launcher: 'Apps',
  dashboard: 'Dashboard layout',
  'smart-home-demo': 'Smart Home demo',
  media: 'Media favorites',
  discover: 'Discover favorites',
  weather: 'Weather location',
  reminders: 'Reminders',
  notes: 'Notes',
}
const label = (key: string) => LABELS[key] ?? key

function download(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DataSection() {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
    } catch (e) {
      showToast({ tone: 'warning', message: e instanceof BackupError ? e.message : 'That file couldn’t be read.' })
    }
  }

  return (
    <SettingsGroup
      id="data"
      title="Data"
      footer="Backups are plain JSON files containing your settings, shortcuts, layout, reminders and notes. Custom wallpaper photos aren’t included."
    >
      <SettingsRow
        label="Export backup"
        description="Save everything Halo stores to a file."
        control={<Button size="sm" icon={<Download size={16} />} onClick={() => { download(createBackup(__APP_VERSION__)); showToast({ tone: 'success', message: 'Backup exported.' }) }}>Export</Button>}
      />
      <SettingsRow
        label="Import backup"
        description="Restore from a Halo backup file. Invalid sections are skipped."
        control={
          <>
            <input
              ref={input}
              type="file"
              accept="application/json,.json"
              hidden
              data-testid="import-input"
              onChange={(e) => {
                void onFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <Button size="sm" icon={<Upload size={16} />} onClick={() => input.current?.click()}>Import</Button>
          </>
        }
      />
      <SettingsRow
        label="Reset Halo"
        description="Erase all Halo data on this device and restore defaults."
        control={<Button size="sm" variant="danger" icon={<RotateCcw size={16} />} onClick={() => setConfirmReset(true)}>Reset</Button>}
      />

      <ConfirmDialog
        open={!!pending}
        title="Import this backup?"
        confirmLabel="Import"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          const report = applyBackup(pending)
          setPending(null)
          const skipped = report.skipped.length ? ` Skipped: ${report.skipped.map(label).join(', ')}.` : ''
          showToast({ tone: report.applied.length ? 'success' : 'warning', message: `Imported ${report.applied.length} section${report.applied.length === 1 ? '' : 's'}.${skipped}` })
        }}
      >
        {pending && (
          <>
            This replaces current data for: {Object.keys(pending.stores).map(label).join(', ')}.
            {pending.exportedAt && ` Exported ${new Date(pending.exportedAt).toLocaleString()}.`}
          </>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmReset}
        title="Reset Halo?"
        confirmLabel="Erase & Reset"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAllStores()
          void removeCustomWallpaper().catch(() => undefined)
          setConfirmReset(false)
          showToast({ message: 'Halo was reset to its defaults.' })
        }}
      >
        Your shortcuts, layout, reminders, notes and settings will be erased from this device. Export a backup first if you might want them back.
      </ConfirmDialog>
    </SettingsGroup>
  )
}
