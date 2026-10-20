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

    static var initialAppsMode: AppsView.Mode {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-haloDiscover") { return .discover }
        #endif
        return .myApps
    }

    static var openSettings: Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("-haloOpenSettings")
        #else
        return false
        #endif
    }

    static var demoHome: Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("-haloDemoHome")
        #else
        return false
        #endif
    }

    /// e.g. `-haloWidgets clock,weather` shows only those widgets
    static var dashboardWidgets: [DashboardItem]? {
        #if DEBUG
        guard let raw = UserDefaults.standard.string(forKey: "haloWidgets") else { return nil }
        return raw.split(separator: ",").compactMap { DashboardWidget(rawValue: String($0)) }.map { DashboardItem(widget: $0, isWide: false) }
        #else
        return nil
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
