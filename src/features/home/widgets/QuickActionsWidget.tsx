import { Moon, Palette, Plus, Power, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../../components/toastStore'
import { smartHome } from '../../../integrations/smart-home'
import { WidgetFrame } from './WidgetFrame'
import styles from '../home.module.css'

export function QuickActionsWidget() {
  const navigate = useNavigate()
  const scene = (id: string, name: string) => {
    smartHome.activateScene(id)
    showToast({ tone: 'success', message: `${name} set${smartHome.simulated ? ' (demo)' : ''}` })
  }
  const actions = [
    { label: 'New Shortcut', icon: Plus, run: () => navigate('/apps', { state: { addShortcut: true } }) },
    { label: 'Good Night', icon: Moon, run: () => scene('good-night', 'Good Night') },
    { label: 'Lights Off', icon: Power, run: () => scene('all-off', 'All Lights Off') },
    { label: 'Appearance', icon: Palette, run: () => navigate('/settings#appearance') },
  ]
  return (
    <WidgetFrame title="Quick Actions" icon={Zap}>
      <div className={styles.actions}>
        {actions.map(({ label, icon: Icon, run }) => (
          <button key={label} type="button" className={styles.action} onClick={run}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </WidgetFrame>
  )
}
