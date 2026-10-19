import { NavLink } from 'react-router-dom'
import { SECTIONS } from './sections'
import styles from './Navigation.module.css'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.item} ${styles.active}` : styles.item
}

/** Floating bottom bar used on phone-width screens. */
export function TabBar() {
  return (
    <nav className={`glass-chrome ${styles.tabBar}`} aria-label="Primary">
      {SECTIONS.map(({ id, path, label, icon: Icon }) => (
        <NavLink key={id} to={path} end={path === '/'} className={navClass}>
          <Icon className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

/** Side navigation used on tablet and desktop widths. */
export function Sidebar() {
  return (
    <nav className={`glass-chrome ${styles.sidebar}`} aria-label="Primary">
      <div className={styles.brand}>
        <img src={`${import.meta.env.BASE_URL}icons/halo.svg`} alt="" className={styles.brandMark} />
        <span className={styles.brandName}>Halo</span>
      </div>
      {SECTIONS.map(({ id, path, label, icon: Icon }) => (
        <NavLink key={id} to={path} end={path === '/'} className={navClass}>
          <Icon className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
