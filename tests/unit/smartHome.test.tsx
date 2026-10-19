import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { smartHome } from '../../src/integrations/smart-home'
import { renderApp } from './renderApp'

describe('Smart Home demo', () => {
  afterEach(() => smartHome.reset())

  it('clearly labels the demo', () => {
    renderApp('/smart-home')
    expect(screen.getByText('Demo mode')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('simulated home')
  })

  it('toggles a light from its tile', async () => {
    renderApp('/smart-home')
    const room = screen.getByRole('list', { name: 'Living Room devices' })
    const lamp = within(room).getByRole('button', { name: 'Floor Lamp' })
    expect(lamp).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(lamp)
    expect(lamp).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('3 lights on')).toBeInTheDocument()
  })

  it('activates a scene', async () => {
    renderApp('/smart-home')
    await userEvent.click(screen.getByRole('button', { name: 'All Lights Off' }))
    expect(screen.getByText('0 lights on')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All Lights Off' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('adjusts the thermostat target from its controls', async () => {
    renderApp('/smart-home')
    const room = screen.getByRole('list', { name: 'Living Room devices' })
    await userEvent.click(within(room).getByRole('button', { name: 'Thermostat controls' }))
    const sheet = screen.getByRole('dialog', { name: 'Thermostat' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Raise target temperature' }))
    expect(within(sheet).getByText('21.5°C')).toBeInTheDocument()
    expect(within(sheet).getByText('Simulated')).toBeInTheDocument()
  })

  it('filters by room', async () => {
    renderApp('/smart-home')
    await userEvent.click(screen.getByRole('button', { name: 'Kitchen' }))
    expect(screen.getByRole('list', { name: 'Kitchen devices' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Bedroom devices' })).not.toBeInTheDocument()
  })
})
