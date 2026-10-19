import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { discoverStore } from '../../src/features/discover/discoverStore'
import { clearAppStoreCache } from '../../src/services/appStore'
import { renderApp } from './renderApp'

function mockAppStore() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    const results = url.includes('/lookup')
      ? [{ trackId: 904237743, trackName: 'Things 3', trackViewUrl: 'https://apps.apple.com/app/id904237743', sellerName: 'Cultured Code', primaryGenreName: 'Productivity', formattedPrice: '$9.99', screenshotUrls: ['https://example.com/s1.png'] }]
      : [{ trackId: 1, trackName: 'Sketchbook', trackViewUrl: 'https://apps.apple.com/app/id1', sellerName: 'Artist Co', primaryGenreName: 'Graphics & Design', formattedPrice: 'Free' }]
    return new Response(JSON.stringify({ resultCount: results.length, results }))
  })
}

describe('Discover', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    discoverStore.reset()
    clearAppStoreCache()
  })

  it('filters curated picks locally without network requests', async () => {
    const fetchSpy = mockAppStore()
    renderApp('/discover')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search apps' }), 'password')
    const picks = within(screen.getByRole('list', { name: 'Halo picks' })).getAllByRole('button')
    expect(picks.map((b) => b.textContent)).toEqual([expect.stringContaining('1Password'), expect.stringContaining('Bitwarden')])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('opens details with an official App Store link and records it as viewed', async () => {
    mockAppStore()
    renderApp('/discover')
    await userEvent.click(within(screen.getByRole('list', { name: 'Featured apps' })).getByRole('button', { name: /Things 3/ }))
    const sheet = screen.getByRole('dialog', { name: 'Things 3' })
    expect(within(sheet).getByRole('link', { name: 'View in App Store' })).toHaveAttribute('href', 'https://apps.apple.com/app/id904237743')
    expect(await within(sheet).findByText(/Productivity · \$9.99/)).toBeInTheDocument()
    expect(within(sheet).getByRole('img', { name: 'Things 3 screenshot 1' })).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Favorite' }))
    expect(discoverStore.get().favorites[0].id).toBe(904237743)
    expect(discoverStore.get().recents[0].id).toBe(904237743)
  })

  it('searches the App Store only when asked', async () => {
    const fetchSpy = mockAppStore()
    renderApp('/discover')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search apps' }), 'sketch')
    expect(fetchSpy).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'App Store' }))
    const results = await screen.findByRole('list', { name: 'App Store results' })
    expect(within(results).getByRole('button', { name: /Sketchbook/ })).toBeInTheDocument()
  })

  it('prefills a shortcut from a listing', async () => {
    mockAppStore()
    renderApp('/discover')
    await userEvent.click(within(screen.getByRole('list', { name: 'Featured apps' })).getByRole('button', { name: /Things 3/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Add to Apps' }))
    const editor = screen.getByRole('dialog', { name: 'New Shortcut' })
    expect(within(editor).getByLabelText('Name')).toHaveValue('Things 3')
    expect(within(editor).getByLabelText('App Store link (optional)')).toHaveValue('https://apps.apple.com/app/id904237743')
  })
})
