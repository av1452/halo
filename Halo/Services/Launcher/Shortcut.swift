import Foundation

/// An item in the launcher: one of Apple's apps or a user-made link.
struct Shortcut: Identifiable, Codable, Equatable, Hashable {
    var id: UUID = UUID()
    var name: String
    /// A website, Universal Link, mailto:/tel:/sms: link or app URL scheme
    var url: String
    var symbol: String
    var colorHex: UInt32
    var folder: String?
    var isFavorite = false
    /// App Store ID used to offer the app when it isn't installed
    var appStoreID: Int?
    /// True for Apple's built-in apps that ship in the default list
    var isAppleApp = false
}

enum ShortcutURL {
    private static let blockedSchemes: Set<String> = ["javascript", "data", "vbscript", "file", "blob", "about"]

    /// Normalises user input: bare domains become https URLs. Returns nil for
    /// empty, malformed or unsafe input.
    static func normalize(_ input: String) -> URL? {
        let value = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, !value.contains(where: \.isWhitespace) else { return nil }

        let schemeRange = value.range(of: #"^[A-Za-z][A-Za-z0-9+.-]*:"#, options: .regularExpression)
        let hostPort = value.range(of: #"^(localhost|[^/:]+\.[^/:]+):\d+(/|$)"#, options: .regularExpression)
        if schemeRange == nil || hostPort != nil {
            guard value.range(of: #"^([^./]+(\.[^./]+)+|localhost)"#, options: .regularExpression) != nil else { return nil }
            return normalize("https://" + value)
        }
        let scheme = String(value[schemeRange!].dropLast()).lowercased()
        guard !blockedSchemes.contains(scheme) else { return nil }
        if scheme == "http" || scheme == "https" {
            guard let url = URL(string: value), let host = url.host(), !host.isEmpty else { return nil }
            return url
        }
        guard value.count > scheme.count + 1 else { return nil }
        return URL(string: value)
    }

    static func isWeb(_ url: URL) -> Bool { ["http", "https"].contains(url.scheme?.lowercased() ?? "") }

    /// The App Store ID in an apps.apple.com link, e.g. ".../app/things-3/id904237743".
    static func appStoreID(in url: URL) -> Int? {
        guard let host = url.host()?.lowercased(), host == "apps.apple.com" || host.hasSuffix(".apps.apple.com"),
              let match = url.path().range(of: #"id(\d+)"#, options: .regularExpression)
        else { return nil }
        return Int(url.path()[match].dropFirst(2))
    }
}

enum AppleApps {
    /// Apple's apps that can be opened by URL scheme. App Store IDs were
    /// checked against Apple's lookup API; some schemes are undocumented,
    /// so Halo reports when one doesn't open.
    static let all: [Shortcut] = [
        Shortcut(name: "Music", url: "music://", symbol: "music.note", colorHex: 0xFA2D48, appStoreID: 1108187390, isAppleApp: true),
        Shortcut(name: "Podcasts", url: "podcasts://", symbol: "mic.fill", colorHex: 0x9B4DFF, appStoreID: 525463029, isAppleApp: true),
        Shortcut(name: "TV", url: "videos://", symbol: "appletv.fill", colorHex: 0x1C1C1E, appStoreID: 1174078549, isAppleApp: true),
        Shortcut(name: "Maps", url: "maps://", symbol: "map.fill", colorHex: 0x30B158, appStoreID: 915056765, isAppleApp: true),
        Shortcut(name: "Mail", url: "message://", symbol: "envelope.fill", colorHex: 0x0A84FF, appStoreID: 1108187098, isAppleApp: true),
        Shortcut(name: "Calendar", url: "calshow://", symbol: "calendar", colorHex: 0xFF3B30, appStoreID: 1108185179, isAppleApp: true),
        Shortcut(name: "Reminders", url: "x-apple-reminderkit://", symbol: "checklist", colorHex: 0xFF9F0A, appStoreID: 1108187841, isAppleApp: true),
        Shortcut(name: "Notes", url: "mobilenotes://", symbol: "note.text", colorHex: 0xE6B800, appStoreID: 1110145109, isAppleApp: true),
        Shortcut(name: "Photos", url: "photos-redirect://", symbol: "photo.on.rectangle", colorHex: 0xFF6B35, appStoreID: 1584215428, isAppleApp: true),
        Shortcut(name: "News", url: "applenews://", symbol: "newspaper.fill", colorHex: 0xFF375F, appStoreID: 1066498020, isAppleApp: true),
        Shortcut(name: "Books", url: "ibooks://", symbol: "book.fill", colorHex: 0xFF9500, appStoreID: 364709193, isAppleApp: true),
        Shortcut(name: "Health", url: "x-apple-health://", symbol: "heart.fill", colorHex: 0xFF2D55, appStoreID: 1242545199, isAppleApp: true),
        Shortcut(name: "FaceTime", url: "facetime://", symbol: "video.fill", colorHex: 0x30D158, appStoreID: 1110145091, isAppleApp: true),
        Shortcut(name: "Shortcuts", url: "shortcuts://", symbol: "square.stack.3d.up.fill", colorHex: 0x5E5CE6, appStoreID: 915249334, isAppleApp: true),
    ]

    static func defaults() -> [Shortcut] {
        all.map { app in
            var app = app
            app.isFavorite = ["Music", "Maps", "Calendar", "Shortcuts"].contains(app.name)
            app.folder = ["Music", "Podcasts", "TV", "Books", "News", "Photos"].contains(app.name) ? "Entertainment" : "Productivity"
            return app
        }
    }
}
