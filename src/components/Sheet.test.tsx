import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    render(<Sheet open={false} title="Hidden" onClose={() => {}}>body</Sheet>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is labelled by its title and closes on Escape', async () => {
    const onClose = vi.fn()
    render(<Sheet open title="Edit shortcut" onClose={onClose}><input aria-label="Name" /></Sheet>)
    expect(screen.getByRole('dialog', { name: 'Edit shortcut' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
