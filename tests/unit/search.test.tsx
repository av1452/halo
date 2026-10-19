import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setSearchOpen } from '../../src/features/search/searchStore'
import { smartHome } from '../../src/integrations/smart-home'
import { renderApp } from './renderApp'

describe('Unified search', () => {
  afterEach(() => {
    setSearchOpen(false)
    smartHome.reset()
  })

  it('opens from the header and with ⌘K, and closes with Escape', async () => {
    renderApp('/apps')
    await userEvent.click(screen.getByRole('button', { name: 'Search Halo' }))
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('combobox', { name: 'Search Halo' })).toHaveFocus()
  })

  it('shows grouped results and an empty state', async () => {
    renderApp('/')
    await userEvent.keyboard('/')
    await userEvent.type(screen.getByRole('combobox'), 'lamp')
    expect(within(screen.getByRole('listbox')).getByRole('group', { name: 'Smart Home' })).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'qqqzzz')
    expect(screen.getByText('No results for “qqqzzz”.')).toBeInTheDocument()
  })

  it('navigates to a device with the keyboard and opens its controls', async () => {
    const { router } = renderApp('/')
    await userEvent.keyboard('{Control>}k{/Control}')
    await userEvent.type(screen.getByRole('combobox'), 'thermostat')
    const combo = screen.getByRole('combobox')
    expect(combo).toHaveAttribute('aria-activedescendant', expect.stringContaining('device-t-living'))
    await userEvent.keyboard('{Enter}')
    expect(router.state.location.pathname).toBe('/smart-home')
    expect(screen.getByRole('dialog', { name: 'Thermostat' })).toBeInTheDocument()
  })

  it('runs a scene from search', async () => {
    renderApp('/')
    await userEvent.keyboard('/')
    await userEvent.type(screen.getByRole('combobox'), 'all lights')
    await userEvent.click(screen.getByRole('option', { name: /All Lights Off/ }))
    expect(smartHome.getSnapshot().devices.filter((d) => d.type === 'light' && d.on)).toHaveLength(0)
  })

  it('jumps to a settings section and a Discover listing', async () => {
    const { router } = renderApp('/')
    await userEvent.keyboard('/')
    await userEvent.type(screen.getByRole('combobox'), 'wallpaper')
    await userEvent.keyboard('{Enter}')
    expect(router.state.location.hash).toBe('#appearance')

    await userEvent.keyboard('/')
    await userEvent.type(screen.getByRole('combobox'), 'bitwarden')
    await userEvent.keyboard('{Enter}')
    expect(router.state.location.pathname).toBe('/discover')
    expect(screen.getByRole('dialog', { name: 'Bitwarden' })).toBeInTheDocument()
  })

  it('moves the active option with the arrow keys', async () => {
    renderApp('/')
    await userEvent.keyboard('/')
    await userEvent.type(screen.getByRole('combobox'), 'home')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true')
  })
})
