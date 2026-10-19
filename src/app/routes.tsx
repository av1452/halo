import type { RouteObject } from 'react-router-dom'
import { AppShell } from './AppShell'
import NotFound from './NotFound'
import HomePage from '../features/home/HomePage'
import AppsPage from '../features/apps/AppsPage'
import SmartHomePage from '../features/smart-home/SmartHomePage'
import MediaPage from '../features/media/MediaPage'
import DiscoverPage from '../features/discover/DiscoverPage'
import SettingsPage from '../features/settings/SettingsPage'

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'apps', element: <AppsPage /> },
      { path: 'smart-home', element: <SmartHomePage /> },
      { path: 'media', element: <MediaPage /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
