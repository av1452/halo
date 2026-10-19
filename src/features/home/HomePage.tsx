import { Construction } from 'lucide-react'
import { EmptyState, Page } from '../../components/Page'

export default function HomePage() {
  return (
    <Page title="Home">
      <EmptyState icon={<Construction />} title="Under construction">
        This section is being built.
      </EmptyState>
    </Page>
  )
}
