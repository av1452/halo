import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SECTIONS } from '../../src/app/sections'
import { renderApp } from './renderApp'

describe('navigation', () => {
  it('renders every section in the primary navigation', () => {
    renderApp()
    const [nav] = screen.getAllByRole('navigation', { name: 'Primary' })
    for (const section of SECTIONS) {
      expect(within(nav).getByRole('link', { name: section.label })).toBeInTheDocument()
    }
  })

  it('moves between all sections and marks the active one', async () => {
    const { router } = renderApp()
    const [nav] = screen.getAllByRole('navigation', { name: 'Primary' })
    for (const section of SECTIONS) {
      await userEvent.click(within(nav).getByRole('link', { name: section.label }))
      expect(router.state.location.pathname).toBe(section.path)
      expect(within(nav).getByRole('link', { name: section.label })).toHaveAttribute('aria-current', 'page')
    }
  })

  it('supports direct navigation to a section route', () => {
    renderApp('/smart-home')
    expect(screen.getByRole('heading', { level: 1, name: 'Smart Home' })).toBeInTheDocument()
  })

  it('shows a fallback for unknown routes', () => {
    renderApp('/does-not-exist')
    expect(screen.getByRole('heading', { name: 'This page doesn’t exist' })).toBeInTheDocument()
  })

  it('supports back navigation', async () => {
    const { router } = renderApp()
    const [nav] = screen.getAllByRole('navigation', { name: 'Primary' })
    await userEvent.click(within(nav).getByRole('link', { name: 'Media' }))
    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/')
  })
})
