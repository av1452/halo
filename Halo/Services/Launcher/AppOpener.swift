import UIKit

/// Opens shortcuts and reports what really happened. Unlike a web page,
/// a native app learns whether iOS opened the URL.
@MainActor @Observable
final class AppOpener {
    enum Outcome: Equatable {
        case opened
        /// The app isn't installed (or the link didn't open); offer the App Store if we can
        case notOpened(appStoreID: Int?)
        case invalid
    }

    /// A shortcut that failed to open, so the UI can explain and offer the App Store.
    var failed: Shortcut?

    /// Install state per shortcut, refreshed when Halo becomes active. Views read
    /// this instead of calling canOpenURL (a system call) while rendering.
    private(set) var installed: [UUID: Bool] = [:]

    private let launcher: LauncherStore

    init(launcher: LauncherStore) {
        self.launcher = launcher
    }

    /// Cached install state; unknown shortcuts are checked once and remembered.
    func isInstalled(_ shortcut: Shortcut) -> Bool {
        installed[shortcut.id] ?? check(shortcut)
    }

    /// Re-checks every shortcut, e.g. when returning to Halo after installing or deleting apps.
    func refreshInstalled(_ shortcuts: [Shortcut]) {
        let next = Dictionary(uniqueKeysWithValues: shortcuts.map { ($0.id, Self.canOpen($0)) })
        if next != installed { installed = next }
    }

    private func check(_ shortcut: Shortcut) -> Bool {
        let result = Self.canOpen(shortcut)
        // Record without triggering a view update mid-render
        Task { @MainActor in if self.installed[shortcut.id] != result { self.installed[shortcut.id] = result } }
        return result
    }

    /// Works for apps whose scheme is listed in LSApplicationQueriesSchemes; web links are always "installed".
    private static func canOpen(_ shortcut: Shortcut) -> Bool {
        guard let url = ShortcutURL.normalize(shortcut.url) else { return false }
        return ShortcutURL.isWeb(url) || UIApplication.shared.canOpenURL(url)
    }

    @discardableResult
    func open(_ shortcut: Shortcut) async -> Outcome {
        guard let url = ShortcutURL.normalize(shortcut.url) else { return .invalid }
        launcher.recordOpen(shortcut.id)
        if await UIApplication.shared.open(url) {
            return .opened
        }
        failed = shortcut
        return .notOpened(appStoreID: shortcut.appStoreID)
    }
}
