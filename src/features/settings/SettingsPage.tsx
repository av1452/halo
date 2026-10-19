import { Construction } from 'lucide-react'
import { EmptyState, Page } from '../../components/Page'

export default function SettingsPage() {
  return (
    <Page title="Settings">
      <EmptyState icon={<Construction />} title="Under construction">
        This section is being built.
      </EmptyState>
    </Page>
  )
}
