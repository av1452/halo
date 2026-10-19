/**
 * Importing this module guarantees every persisted store is registered, so
 * backup, import and reset cover all data even if feature code is later
 * lazy-loaded. Add new stores here.
 */
export { themeStore } from '../design-system/themeStore'
export { preferencesStore } from '../features/settings/preferencesStore'
export { launcherStore } from '../features/apps/launcherStore'
export { dashboardStore } from '../features/home/dashboardStore'
export { notesStore, remindersStore, weatherStore } from '../features/home/widgetStores'
export { mediaStore } from '../features/media/mediaStore'
export { discoverStore } from '../features/discover/discoverStore'
export { smartHome } from '../integrations/smart-home'
