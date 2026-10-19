import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Halo name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Halo' })).toBeInTheDocument()
  })
})
