import SwiftUI

/// Owns Halo's stores and services. Created once and shared through the environment.
@MainActor @Observable
final class AppModel {
    let settings: SettingsStore

    init(directory: URL = JSONStore<Settings>.defaultDirectory) {
        settings = SettingsStore(store: JSONStore(name: "settings", directory: directory))
    }
}
