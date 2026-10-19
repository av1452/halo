import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClassName } from '../components/buttonClassName'
import { EmptyState, Page } from '../components/Page'

export default function NotFound() {
  return (
    <Page title="Not found">
      <EmptyState
        icon={<MapPinOff />}
        title="This page doesn’t exist"
        action={
          <Link to="/" className={buttonClassName('primary')}>
            Go to Home
          </Link>
        }
      >
        The link may be out of date, or the page was moved.
      </EmptyState>
    </Page>
  )
}
