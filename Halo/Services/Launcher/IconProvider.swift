import UIKit

/// Real icons for shortcuts. iOS doesn't let apps read other apps' icons from
/// the device, so Halo uses the closest real source:
/// - apps: their official App Store artwork, from Apple
/// - websites: the site's own apple-touch-icon (what Safari uses for Home Screen icons)
/// Icons are cached on disk after the first download.
@MainActor @Observable
final class IconProvider {
    typealias Fetch = @Sendable (URL) async throws -> (Data, URLResponse)

    private(set) var images: [String: UIImage] = [:]
    @ObservationIgnored private var attempted: Set<String> = []
    @ObservationIgnored private let appStore: AppStoreClient
    @ObservationIgnored private let fetch: Fetch
    @ObservationIgnored private let directory: URL

    init(appStore: AppStoreClient, directory: URL = IconProvider.defaultDirectory,
         fetch: @escaping Fetch = { try await URLSession.shared.data(from: $0) }) {
        self.appStore = appStore
        self.directory = directory
        self.fetch = fetch
    }

    static var defaultDirectory: URL {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("Halo/Icons", isDirectory: true)
    }

    /// The cache key for a shortcut's icon, or nil if it has no real icon source.
    nonisolated static func key(for shortcut: Shortcut) -> String? {
        if let id = shortcut.appStoreID { return "app-\(id)" }
        if let url = ShortcutURL.normalize(shortcut.url), ShortcutURL.isWeb(url), let host = url.host()?.lowercased() {
            return "web-\(host)"
        }
        return nil
    }

    func image(for shortcut: Shortcut) -> UIImage? {
        Self.key(for: shortcut).flatMap { images[$0] }
    }

    /// Loads icons for these shortcuts: from disk first, then the network.
    /// App Store icons are fetched with a single lookup request.
    func load(_ shortcuts: [Shortcut]) async {
        var appIDs: [Int: String] = [:]
        var sites: [String: URL] = [:]
        for shortcut in shortcuts {
            guard let key = Self.key(for: shortcut), !attempted.contains(key) else { continue }
            attempted.insert(key)
            // Read and decode the cached file off the main thread
            let directory = self.directory
            if let cached = await Task.detached(priority: .userInitiated, operation: { Self.readCache(key, in: directory) }).value {
                images[key] = cached
            } else if let id = shortcut.appStoreID {
                appIDs[id] = key
            } else if let url = ShortcutURL.normalize(shortcut.url), let host = url.host() {
                sites[key] = URL(string: "https://\(host)")
            }
        }

        if !appIDs.isEmpty, let apps = try? await appStore.lookup(Array(appIDs.keys)) {
            for app in apps {
                guard let key = appIDs[app.id], let url = app.iconURL else { continue }
                if let image = await download(url) { store(image, key: key) }
            }
        }
        for (key, site) in sites {
            for path in ["apple-touch-icon.png", "apple-touch-icon-precomposed.png"] {
                if let image = await download(site.appendingPathComponent(path)) {
                    store(image, key: key)
                    break
                }
            }
        }
        // Allow a retry later for anything that failed (e.g. offline)
        for key in Set(appIDs.values).union(sites.keys) where images[key] == nil { attempted.remove(key) }
    }

    func clearCache() {
        try? FileManager.default.removeItem(at: directory)
        images = [:]
        attempted = []
    }

    private func download(_ url: URL) async -> UIImage? {
        guard let (data, response) = try? await fetch(url),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let image = UIImage(data: data),
              image.size.width >= 57, image.size.height >= 57  // ignore tiny or broken images
        else { return nil }
        return image
    }

    /// Icons are shown at most ~76pt, so keep a 228px copy (76pt × 3) that's
    /// already decoded; drawing it while scrolling is then just a blit.
    nonisolated static let pixelSize: CGFloat = 228

    nonisolated static func prepared(_ image: UIImage) -> UIImage {
        let target = CGSize(width: pixelSize, height: pixelSize)
        if image.size.width * image.scale <= pixelSize, let decoded = image.preparingForDisplay() { return decoded }
        return image.preparingThumbnail(of: target) ?? image
    }

    private func store(_ image: UIImage, key: String) {
        let image = Self.prepared(image)
        images[key] = image
        guard let png = image.pngData() else { return }
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try? png.write(to: directory.appendingPathComponent("\(key).png"), options: .atomic)
    }

    nonisolated private static func readCache(_ key: String, in directory: URL) -> UIImage? {
        (try? Data(contentsOf: directory.appendingPathComponent("\(key).png"))).flatMap(UIImage.init(data:)).map(prepared)
    }
}
