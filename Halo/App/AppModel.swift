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
        weather = WeatherController(store: JSONStore(name: "weather", directory: directory))
        dashboard = DashboardStore(store: JSONStore(name: "dashboard", directory: directory))
        notes = NotesStore(store: JSONStore(name: "notes", directory: directory))
        if LaunchOptions.demoHome { settings.value.smartHomeDemo = true }
    }
}
