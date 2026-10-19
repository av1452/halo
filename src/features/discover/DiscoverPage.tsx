import { Construction } from 'lucide-react'
import { EmptyState, Page } from '../../components/Page'

export default function DiscoverPage() {
  return (
    <Page title="Discover">
      <EmptyState icon={<Construction />} title="Under construction">
        This section is being built.
      </EmptyState>
    </Page>
  )
}
