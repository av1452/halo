import SwiftUI

/// Owns Halo's stores and services. Created once and shared through the environment.
@MainActor @Observable
final class AppModel {
    let settings: SettingsStore
    let smartHome: SmartHomeController
    let launcher: LauncherStore
    let opener: AppOpener
    let discover: DiscoverStore
    let appStore = AppStoreClient()
    let music = MusicController()
    let icons: IconProvider
    let calendar = CalendarController()
    let weather: WeatherController
    let dashboard: DashboardStore
    let notes: NotesStore

    init(directory: URL = JSONStore<Settings>.defaultDirectory) {
        settings = SettingsStore(store: JSONStore(name: "settings", directory: directory))
        smartHome = SmartHomeController(settings: settings, directory: directory)
        launcher = LauncherStore(store: JSONStore(name: "launcher", directory: directory))
        opener = AppOpener(launcher: launcher)
        discover = DiscoverStore(store: JSONStore(name: "discover", directory: directory))
        icons = IconProvider(appStore: appStore)
        weather = WeatherController(store: JSONStore(name: "weather", directory: directory))
        dashboard = DashboardStore(store: JSONStore(name: "dashboard", directory: directory))
        notes = NotesStore(store: JSONStore(name: "notes", directory: directory))
        if LaunchOptions.demoHome { settings.value.smartHomeDemo = true }
    }

    // MARK: - Installed apps

    /// Adds popular apps found on this device to Apps and removes ones that were uninstalled.
    @discardableResult
    func syncInstalledApps() -> LauncherStore.SyncResult {
        defer { opener.refreshInstalled(launcher.shortcuts) }
        guard settings.value.detectInstalledApps else { return .init() }
        return launcher.syncInstalled { app in
            URL(string: app.url).map { UIApplication.shared.canOpenURL($0) } ?? false
        }
    }

    // MARK: - Backup

    func makeBackup() -> HaloBackup {
        var backup = HaloBackup()
        backup.settings = settings.value
        backup.launcher = launcher.state
        backup.dashboard = dashboard.items
        backup.discover = discover.state
        backup.notes = notes.text
        backup.pinnedDevices = smartHome.pinned
        backup.weatherPlace = weather.place
        return backup
    }

    /// Applies each section present in the backup and returns their names.
    @discardableResult
    func apply(_ backup: HaloBackup) async -> [String] {
        if let value = backup.settings { settings.value = value }
        if let value = backup.launcher { launcher.replace(with: value) }
        if let value = backup.dashboard { dashboard.replace(with: value) }
        if let value = backup.discover { discover.replace(with: value) }
        if let value = backup.notes { notes.text = value }
        if let value = backup.pinnedDevices { smartHome.replacePins(value) }
        if let value = backup.weatherPlace { await weather.setPlace(value) }
        return backup.sections
    }

    /// Erases Halo's data on this device. Apple Home, Calendar and Reminders data are untouched.
    func resetAll() {
        settings.reset()
        launcher.reset()
        dashboard.reset()
        discover.reset()
        notes.reset()
        smartHome.reset()
        weather.reset()
    }
}
