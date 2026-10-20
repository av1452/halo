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

    private let launcher: LauncherStore

    init(launcher: LauncherStore) {
        self.launcher = launcher
    }

    /// Works for apps whose scheme is listed in LSApplicationQueriesSchemes; web links are always "installed".
    func isInstalled(_ shortcut: Shortcut) -> Bool {
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
