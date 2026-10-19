import { isSceneActive, smartHome, type Device, type Scene } from '../../integrations/smart-home'
import { showToast } from '../../components/toastStore'
import { SCENE_ICONS } from './describe'
import { Sparkles } from 'lucide-react'
import styles from './smartHome.module.css'

export function SceneButton({ scene, devices }: { scene: Scene; devices: Device[] }) {
  const Icon = SCENE_ICONS[scene.icon] ?? Sparkles
  const active = isSceneActive(devices, scene)
  return (
    <button
      type="button"
      className={`${active ? styles.sceneActive : 'glass-thin'} ${styles.scene}`}
      aria-pressed={active}
      onClick={() => {
        smartHome.activateScene(scene.id)
        showToast({ tone: 'success', message: `${scene.name} set${smartHome.simulated ? ' (demo)' : ''}` })
      }}
    >
      <span className={styles.sceneIcon} aria-hidden="true"><Icon size={20} /></span>
      <span className={styles.sceneName}>{scene.name}</span>
    </button>
  )
}
