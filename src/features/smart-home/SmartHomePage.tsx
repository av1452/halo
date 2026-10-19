import { Construction } from 'lucide-react'
import { EmptyState, Page } from '../../components/Page'

export default function SmartHomePage() {
  return (
    <Page title="Smart Home">
      <EmptyState icon={<Construction />} title="Under construction">
        This section is being built.
      </EmptyState>
    </Page>
  )
}
