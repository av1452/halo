import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Sidebar, TabBar } from './Navigation'
import { ThemeController } from './ThemeController'
import styles from './AppShell.module.css'

export function AppShell() {
  return (
    <>
      <ThemeController />
      <div className="halo-wallpaper" aria-hidden="true" />
      <a className={styles.skip} href="#main">Skip to content</a>
      <Sidebar />
      <main id="main" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <TabBar />
      <ScrollRestoration />
    </>
  )
}
