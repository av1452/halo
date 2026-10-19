import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { themeStore } from '../../src/design-system/themeStore'
import { launcherStore } from '../../src/features/apps/launcherStore'
import { preferencesStore } from '../../src/features/settings/preferencesStore'
import { resetAllStores } from '../../src/storage/backup'
import { renderApp } from './renderApp'

const backupFile = (stores: object) =>
  new File([JSON.stringify({ format: 'halo-backup', formatVersion: 1, exportedAt: '2026-10-01T00:00:00Z', appVersion: '0.1.0', stores })], 'halo-backup.json', { type: 'application/json' })

describe('Settings', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetAllStores()
  })

  it('applies and persists appearance changes', async () => {
    renderApp('/settings')
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Purple' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Vivid' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }))
    const root = document.documentElement
    expect(root.dataset.theme).toBe('dark')
    expect(root.dataset.glass).toBe('vivid')
    expect(root.dataset.motion).toBe('reduced')
    expect(root.style.getPropertyValue('--accent')).toBe('#bf5af2')
    expect(JSON.parse(localStorage.getItem('halo:theme')!).data).toMatchObject({ appearance: 'dark', accent: 'purple', glass: 'vivid', reduceMotion: true })
  })

  it('uses the display name in the Home greeting', async () => {
    const { router } = renderApp('/settings')
    await userEvent.type(screen.getByLabelText('Your name'), 'Robin')
    await router.navigate('/')
    expect(await screen.findByRole('heading', { level: 1, name: /, Robin$/ })).toBeInTheDocument()
  })

  it('exports a backup file', async () => {
    const createUrl = vi.fn((_obj: Blob | MediaSource) => 'blob:export')
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createUrl)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderApp('/settings')
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(click).toHaveBeenCalled()
    const text = await (createUrl.mock.calls[0][0] as Blob).text()
    expect(JSON.parse(text)).toMatchObject({ format: 'halo-backup', stores: { theme: expect.any(Object), launcher: expect.any(Object) } })
  })

  it('imports a valid backup after confirmation and reports skipped sections', async () => {
    renderApp('/settings')
    const file = backupFile({ preferences: { v: 1, data: { displayName: 'Imported', temperatureUnit: 'fahrenheit' } }, launcher: { v: 1, data: 'corrupt' } })
    await userEvent.upload(screen.getByTestId('import-input'), file)
    const dialog = await screen.findByRole('alertdialog', { name: 'Import this backup?' })
    expect(preferencesStore.get().displayName).toBe('')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }))
    expect(preferencesStore.get()).toMatchObject({ displayName: 'Imported', temperatureUnit: 'fahrenheit' })
    expect(launcherStore.get().shortcuts.length).toBeGreaterThan(0)
    expect(await screen.findByText(/Imported 1 section\. Skipped: Apps\./)).toBeInTheDocument()
  })

  it('rejects files that are not Halo backups', async () => {
    renderApp('/settings')
    await userEvent.upload(screen.getByTestId('import-input'), new File(['{"hello":1}'], 'other.json', { type: 'application/json' }))
    expect(await screen.findByText('This file isn’t a Halo backup.')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('resets everything only after confirming', async () => {
    themeStore.set((t) => ({ ...t, accent: 'green' }))
    renderApp('/settings')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Reset Halo?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(themeStore.get().accent).toBe('green')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Erase & Reset' }))
    await waitFor(() => expect(themeStore.get().accent).toBe('blue'))
  })
})
