import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mediaStore } from '../../src/features/media/mediaStore'
import { renderApp } from './renderApp'

describe('Media', () => {
  afterEach(() => mediaStore.reset())

  it('shows an honest empty Now Playing state', () => {
    renderApp('/media')
    expect(screen.getByRole('heading', { name: 'Nothing playing in Halo' })).toBeInTheDocument()
    expect(screen.getByText(/can’t see or control music playing in other apps/)).toBeInTheDocument()
  })

  it('favorites a service and records opens', async () => {
    renderApp('/media')
    const video = screen.getByRole('list', { name: 'Video services' })
    await userEvent.click(within(video).getByRole('button', { name: 'Favorite Netflix' }))
    expect(within(screen.getByRole('list', { name: 'Favorite services' })).getByRole('link', { name: 'Netflix' })).toBeInTheDocument()

    await userEvent.click(within(video).getByRole('link', { name: 'Twitch' }))
    expect(mediaStore.get().recents[0]).toBe('twitch')
  })

  it('filters by category', async () => {
    renderApp('/media')
    await userEvent.click(screen.getByRole('button', { name: 'Podcasts' }))
    expect(screen.getByRole('list', { name: 'Podcasts services' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Music services' })).not.toBeInTheDocument()
  })
})
