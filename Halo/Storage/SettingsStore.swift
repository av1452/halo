import SwiftUI

enum AppearancePreference: String, Codable, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }
    var title: String { self == .system ? "Automatic" : rawValue.capitalized }
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

enum AccentChoice: String, Codable, CaseIterable, Identifiable {
    case blue, indigo, purple, pink, orange, green, teal, graphite
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var color: Color {
        switch self {
        case .blue: .blue
        case .indigo: .indigo
        case .purple: .purple
        case .pink: .pink
        case .orange: .orange
        case .green: .green
        case .teal: .teal
        case .graphite: .gray
        }
    }
}

enum TemperatureUnit: String, Codable, CaseIterable, Identifiable {
    case celsius, fahrenheit
    var id: String { rawValue }
    var symbol: String { self == .celsius ? "°C" : "°F" }
}

struct Settings: Codable, Equatable {
    var displayName = ""
    var appearance = AppearancePreference.system
    var accent = AccentChoice.blue
    var wallpaper = WallpaperStyle.dusk
    var temperatureUnit = TemperatureUnit.celsius
    /// Show the simulated demo home instead of (or when there is no) Apple Home
    var smartHomeDemo = false

    // Tolerate missing keys so older files still load
    init() {}
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let d = Settings()
        displayName = (try? c.decode(String.self, forKey: .displayName)) ?? d.displayName
        appearance = (try? c.decode(AppearancePreference.self, forKey: .appearance)) ?? d.appearance
        accent = (try? c.decode(AccentChoice.self, forKey: .accent)) ?? d.accent
        wallpaper = (try? c.decode(WallpaperStyle.self, forKey: .wallpaper)) ?? d.wallpaper
        temperatureUnit = (try? c.decode(TemperatureUnit.self, forKey: .temperatureUnit)) ?? d.temperatureUnit
        smartHomeDemo = (try? c.decode(Bool.self, forKey: .smartHomeDemo)) ?? d.smartHomeDemo
    }
}

@MainActor @Observable
final class SettingsStore {
    var value: Settings { didSet { if value != oldValue { store.save(value) } } }
    private let store: JSONStore<Settings>

    init(store: JSONStore<Settings> = JSONStore(name: "settings")) {
        self.store = store
        self.value = store.load() ?? Settings()
    }

    func reset() {
        store.remove()
        value = Settings()
    }
}
