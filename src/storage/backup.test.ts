import { applyBackup, BackupError, createBackup, parseBackup } from './backup'
import { themeStore } from '../design-system/themeStore'
import { preferencesStore } from '../features/settings/preferencesStore'

describe('backup', () => {
  afterEach(() => {
    themeStore.reset()
    preferencesStore.reset()
  })

  it('round-trips store data through export and import', () => {
    themeStore.set((t) => ({ ...t, accent: 'pink', appearance: 'dark' }))
    preferencesStore.set((p) => ({ ...p, displayName: 'Sam' }))
    const text = JSON.stringify(createBackup('0.1.0'))

    themeStore.reset()
    preferencesStore.reset()
    const report = applyBackup(parseBackup(text))

    expect(report.applied).toEqual(expect.arrayContaining(['theme', 'preferences']))
    expect(themeStore.get().accent).toBe('pink')
    expect(preferencesStore.get().displayName).toBe('Sam')
  })

  it('rejects files that are not Halo backups', () => {
    expect(() => parseBackup('nope')).toThrow(BackupError)
    expect(() => parseBackup('{"format":"other"}')).toThrow('isn’t a Halo backup')
    expect(() => parseBackup('{"format":"halo-backup","formatVersion":99,"stores":{}}')).toThrow('newer version')
  })

  it('skips invalid or unknown sections without touching existing data', () => {
    themeStore.set((t) => ({ ...t, accent: 'green' }))
    const report = applyBackup(
      parseBackup(
        JSON.stringify({
          format: 'halo-backup',
          formatVersion: 1,
          stores: { theme: { v: 1, data: 'garbage' }, mystery: { v: 1, data: {} } },
        }),
      ),
    )
    expect(report.skipped).toEqual(['theme', 'mystery'])
    expect(themeStore.get().accent).toBe('green')
  })
})
