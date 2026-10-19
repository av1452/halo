import { Construction } from 'lucide-react'
import { EmptyState, Page } from '../../components/Page'

export default function MediaPage() {
  return (
    <Page title="Media">
      <EmptyState icon={<Construction />} title="Under construction">
        This section is being built.
      </EmptyState>
    </Page>
  )
}
