import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from './Toggle'

it('exposes a switch role and reports changes', async () => {
  const onChange = vi.fn()
  render(<Toggle checked={false} onChange={onChange} label="Living room lamp" />)
  await userEvent.click(screen.getByRole('switch', { name: 'Living room lamp' }))
  expect(onChange).toHaveBeenCalledWith(true)
})
