import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dashboardStore } from '../../src/features/home/dashboardStore'
import { remindersStore } from '../../src/features/home/widgetStores'
import { renderApp } from './renderApp'

describe('Home dashboard', () => {
  afterEach(() => {
    dashboardStore.reset()
    remindersStore.reset()
  })

  it('greets the user and shows default widgets', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Good (morning|afternoon|evening|night)/)
    for (const name of ['Clock', 'Weather', 'Favorite Apps', 'Smart Home', 'Reminders', 'Calendar', 'Quick Actions']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('asks for a location instead of showing made-up weather', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderApp('/')
    const weather = screen.getByRole('region', { name: 'Weather' })
    expect(within(weather).getByRole('button', { name: 'Set location' })).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('removes and re-adds a widget in edit mode, persisting the layout', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove Calendar' }))
    expect(screen.queryByRole('region', { name: 'Calendar' })).not.toBeInTheDocument()
    expect(localStorage.getItem('halo:dashboard')).not.toContain('calendar')

    await userEvent.click(screen.getByRole('button', { name: 'Add widget' }))
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Add Widget' })).getByRole('button', { name: 'Add Calendar' }))
    expect(localStorage.getItem('halo:dashboard')).toContain('calendar')
  })

  it('adds and completes a reminder', async () => {
    renderApp('/')
    const widget = screen.getByRole('region', { name: 'Reminders' })
    await userEvent.type(within(widget).getByLabelText('New reminder'), 'Call the plumber')
    await userEvent.click(within(widget).getByRole('button', { name: 'Add reminder' }))
    const box = within(widget).getByRole('checkbox', { name: 'Call the plumber' })
    await userEvent.click(box)
    expect(box).toBeChecked()
    expect(remindersStore.get()[0].done).toBe(true)
  })

  it('opens the shortcut editor from a quick action', async () => {
    renderApp('/')
    await userEvent.click(within(screen.getByRole('region', { name: 'Quick Actions' })).getByRole('button', { name: 'New Shortcut' }))
    expect(screen.getByRole('dialog', { name: 'New Shortcut' })).toBeInTheDocument()
  })
})

describe('Weather widget', () => {
  const place = { name: 'Lisbon', latitude: 38.72, longitude: -9.14 }
  afterEach(async () => {
    vi.restoreAllMocks()
    const { weatherStore } = await import('../../src/features/home/widgetStores')
    weatherStore.reset()
  })

  it('shows live data once a place is set', async () => {
    const { weatherStore } = await import('../../src/features/home/widgetStores')
    weatherStore.set({ place, cache: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ current: { temperature_2m: 18.4, weather_code: 0 }, daily: { temperature_2m_max: [22], temperature_2m_min: [13] } })),
    )
    renderApp('/')
    const weather = screen.getByRole('region', { name: 'Weather' })
    expect(await within(weather).findByText('18°C')).toBeInTheDocument()
    expect(within(weather).getByText(/Clear · H 22°C L 13°C/)).toBeInTheDocument()
  })

  it('explains failures instead of showing stale or fake data', async () => {
    const { weatherStore } = await import('../../src/features/home/widgetStores')
    weatherStore.set({ place, cache: null })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    renderApp('/')
    const weather = screen.getByRole('region', { name: 'Weather' })
    expect(await within(weather).findByRole('alert')).toHaveTextContent('Couldn’t reach the weather service')
  })
})

describe('Weather location privacy', () => {
  afterEach(async () => {
    const { weatherStore } = await import('../../src/features/home/widgetStores')
    weatherStore.reset()
  })

  it('stores device location rounded to about 100 m', async () => {
    const { weatherStore } = await import('../../src/features/home/widgetStores')
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (ok: PositionCallback) => ok({ coords: { latitude: 51.507351, longitude: -0.127758 } } as GeolocationPosition) },
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))
    renderApp('/')
    await userEvent.click(within(screen.getByRole('region', { name: 'Weather' })).getByRole('button', { name: 'Set location' }))
    await userEvent.click(screen.getByRole('button', { name: 'Use my current location' }))
    expect(weatherStore.get().place).toMatchObject({ latitude: 51.507, longitude: -0.128 })
    vi.restoreAllMocks()
  })
})
