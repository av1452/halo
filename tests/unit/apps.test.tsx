import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { launcherStore } from '../../src/features/apps/launcherStore'
import { renderApp } from './renderApp'

describe('Apps launcher', () => {
  afterEach(() => launcherStore.reset())

  it('adds a custom shortcut and persists it', async () => {
    renderApp('/apps')
    await userEvent.click(screen.getByRole('button', { name: 'Add shortcut' }))
    const dialog = screen.getByRole('dialog', { name: 'New Shortcut' })
    await userEvent.type(within(dialog).getByLabelText('Name'), 'My Blog')
    await userEvent.type(within(dialog).getByLabelText('Address'), 'myblog.example')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const link = screen.getByRole('link', { name: /My Blog/ })
    expect(link).toHaveAttribute('href', 'https://myblog.example/')
    expect(localStorage.getItem('halo:launcher')).toContain('My Blog')
  })

  it('shows validation errors and refuses unsafe addresses', async () => {
    renderApp('/apps')
    await userEvent.click(screen.getByRole('button', { name: 'Add shortcut' }))
    const dialog = screen.getByRole('dialog', { name: 'New Shortcut' })
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Evil')
    await userEvent.type(within(dialog).getByLabelText('Address'), 'javascript:alert(1)')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Enter a web address')
  })

  it('edits and removes shortcuts in edit mode', async () => {
    renderApp('/apps')
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Edit GitHub' }))
    const name = within(screen.getByRole('dialog')).getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Code')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Edit Code' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Remove Code' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }))
    expect(screen.queryByRole('button', { name: 'Edit Code' })).not.toBeInTheDocument()
  })

  it('filters by search text and keeps it in the URL', async () => {
    const { router } = renderApp('/apps')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search shortcuts' }), 'wiki')
    const grid = screen.getByRole('list', { name: 'Shortcuts' })
    expect(within(grid).getAllByRole('link')).toHaveLength(1)
    expect(router.state.location.search).toBe('?q=wiki')
  })

  it('filters by folder', async () => {
    renderApp('/apps')
    await userEvent.click(screen.getByRole('button', { name: 'Entertainment' }))
    const hrefs = within(screen.getByRole('list', { name: 'Shortcuts' })).getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['https://www.youtube.com/', 'https://open.spotify.com/'])
  })
})
