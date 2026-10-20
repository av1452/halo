import SwiftUI

/// Owns Halo's stores and services. Created once and shared through the environment.
@MainActor @Observable
final class AppModel {
    let settings: SettingsStore
    let smartHome: SmartHomeController

    init(directory: URL = JSONStore<Settings>.defaultDirectory) {
        settings = SettingsStore(store: JSONStore(name: "settings", directory: directory))
        smartHome = SmartHomeController(settings: settings, directory: directory)
        if LaunchOptions.demoHome { settings.value.smartHomeDemo = true }
    }
}
