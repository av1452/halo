import Foundation

/// Debug-only launch arguments used by UI tests and screenshots, e.g.
/// `-haloSection smartHome -haloOpenSettings`. Release builds ignore them.
enum LaunchOptions {
    static var initialSection: AppSection {
        #if DEBUG
        if let raw = UserDefaults.standard.string(forKey: "haloSection"), let section = AppSection(rawValue: raw) {
            return section
        }
        #endif
        return .home
    }

    static var openSettings: Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("-haloOpenSettings")
        #else
        return false
        #endif
    }

    /// Stores live in a throwaway directory so tests start fresh and never touch real data.
    static var isolatedStorage: Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("-haloResetData")
        #else
        return false
        #endif
    }
}
