import Foundation

/// A popular app Halo can detect on the device. iOS only lets apps check for
/// other apps by URL scheme, for at most 50 schemes declared in Info.plist
/// (LSApplicationQueriesSchemes), so detection is limited to this list.
struct KnownApp: Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    /// URL scheme used both to detect the app and to open it
    let scheme: String
    /// Checked against Apple's lookup API on 2026-10-19
    let appStoreID: Int
    let folder: String
    let symbol: String
    let colorHex: UInt32

    var url: String { "\(scheme)://" }

    func shortcut() -> Shortcut {
        Shortcut(name: name, url: url, symbol: symbol, colorHex: colorHex, folder: folder, appStoreID: appStoreID, knownAppID: id, autoAdded: true)
    }
}

enum KnownApps {
    /// Schemes come from the apps' public documentation or long-standing use.
    /// A wrong scheme fails safe: the app simply isn't detected.
    static let all: [KnownApp] = [
        // Social
        KnownApp(id: "instagram", name: "Instagram", scheme: "instagram", appStoreID: 389801252, folder: "Social", symbol: "camera.fill", colorHex: 0xE1306C),
        KnownApp(id: "facebook", name: "Facebook", scheme: "fb", appStoreID: 284882215, folder: "Social", symbol: "person.2.fill", colorHex: 0x1877F2),
        KnownApp(id: "messenger", name: "Messenger", scheme: "fb-messenger", appStoreID: 454638411, folder: "Social", symbol: "message.fill", colorHex: 0x0084FF),
        KnownApp(id: "whatsapp", name: "WhatsApp", scheme: "whatsapp", appStoreID: 310633997, folder: "Social", symbol: "phone.bubble.fill", colorHex: 0x25D366),
        KnownApp(id: "x", name: "X", scheme: "twitter", appStoreID: 333903271, folder: "Social", symbol: "xmark", colorHex: 0x000000),
        KnownApp(id: "threads", name: "Threads", scheme: "barcelona", appStoreID: 6446901002, folder: "Social", symbol: "at", colorHex: 0x000000),
        KnownApp(id: "snapchat", name: "Snapchat", scheme: "snapchat", appStoreID: 447188370, folder: "Social", symbol: "camera.viewfinder", colorHex: 0xFFFC00),
        KnownApp(id: "telegram", name: "Telegram", scheme: "tg", appStoreID: 686449807, folder: "Social", symbol: "paperplane.fill", colorHex: 0x229ED9),
        KnownApp(id: "signal", name: "Signal", scheme: "sgnl", appStoreID: 874139669, folder: "Social", symbol: "lock.shield.fill", colorHex: 0x3A76F0),
        KnownApp(id: "discord", name: "Discord", scheme: "discord", appStoreID: 985746746, folder: "Social", symbol: "gamecontroller.fill", colorHex: 0x5865F2),
        KnownApp(id: "reddit", name: "Reddit", scheme: "reddit", appStoreID: 1064216828, folder: "Social", symbol: "bubble.left.and.bubble.right.fill", colorHex: 0xFF4500),
        KnownApp(id: "pinterest", name: "Pinterest", scheme: "pinterest", appStoreID: 429047995, folder: "Social", symbol: "pin.fill", colorHex: 0xE60023),
        KnownApp(id: "linkedin", name: "LinkedIn", scheme: "linkedin", appStoreID: 288429040, folder: "Social", symbol: "briefcase.fill", colorHex: 0x0A66C2),
        // Entertainment
        KnownApp(id: "spotify", name: "Spotify", scheme: "spotify", appStoreID: 324684580, folder: "Entertainment", symbol: "music.note", colorHex: 0x1DB954),
        KnownApp(id: "youtube", name: "YouTube", scheme: "youtube", appStoreID: 544007664, folder: "Entertainment", symbol: "play.rectangle.fill", colorHex: 0xFF0000),
        KnownApp(id: "netflix", name: "Netflix", scheme: "nflx", appStoreID: 363590051, folder: "Entertainment", symbol: "film.fill", colorHex: 0xB20710),
        KnownApp(id: "disneyplus", name: "Disney+", scheme: "disneyplus", appStoreID: 1446075923, folder: "Entertainment", symbol: "sparkles.tv.fill", colorHex: 0x113CCF),
        KnownApp(id: "hulu", name: "Hulu", scheme: "hulu", appStoreID: 376510438, folder: "Entertainment", symbol: "tv.fill", colorHex: 0x1CE783),
        KnownApp(id: "twitch", name: "Twitch", scheme: "twitch", appStoreID: 460177396, folder: "Entertainment", symbol: "dot.radiowaves.left.and.right", colorHex: 0x9146FF),
        // Productivity
        KnownApp(id: "gmail", name: "Gmail", scheme: "googlegmail", appStoreID: 422689480, folder: "Productivity", symbol: "envelope.fill", colorHex: 0xEA4335),
        KnownApp(id: "outlook", name: "Outlook", scheme: "ms-outlook", appStoreID: 951937596, folder: "Productivity", symbol: "envelope.badge.fill", colorHex: 0x0078D4),
        KnownApp(id: "slack", name: "Slack", scheme: "slack", appStoreID: 618783545, folder: "Productivity", symbol: "number", colorHex: 0x4A154B),
        KnownApp(id: "teams", name: "Teams", scheme: "msteams", appStoreID: 1113153706, folder: "Productivity", symbol: "person.3.fill", colorHex: 0x6264A7),
        KnownApp(id: "zoom", name: "Zoom", scheme: "zoomus", appStoreID: 546505307, folder: "Productivity", symbol: "video.fill", colorHex: 0x0B5CFF),
        KnownApp(id: "googledrive", name: "Google Drive", scheme: "googledrive", appStoreID: 507874739, folder: "Productivity", symbol: "externaldrive.fill", colorHex: 0x1FA463),
        // Web
        KnownApp(id: "chrome", name: "Chrome", scheme: "googlechrome", appStoreID: 535886823, folder: "Web", symbol: "globe", colorHex: 0x4285F4),
        KnownApp(id: "firefox", name: "Firefox", scheme: "firefox", appStoreID: 989804926, folder: "Web", symbol: "flame.fill", colorHex: 0xFF7139),
        KnownApp(id: "google", name: "Google", scheme: "google", appStoreID: 284815942, folder: "Web", symbol: "magnifyingglass", colorHex: 0x4285F4),
        // Travel
        KnownApp(id: "googlemaps", name: "Google Maps", scheme: "comgooglemaps", appStoreID: 585027354, folder: "Travel", symbol: "map.fill", colorHex: 0x34A853),
        KnownApp(id: "waze", name: "Waze", scheme: "waze", appStoreID: 323229106, folder: "Travel", symbol: "car.fill", colorHex: 0x33CCFF),
        KnownApp(id: "uber", name: "Uber", scheme: "uber", appStoreID: 368677368, folder: "Travel", symbol: "car.side.fill", colorHex: 0x000000),
        KnownApp(id: "lyft", name: "Lyft", scheme: "lyft", appStoreID: 529379082, folder: "Travel", symbol: "car.side.fill", colorHex: 0xFF00BF),
        // Finance and health
        KnownApp(id: "venmo", name: "Venmo", scheme: "venmo", appStoreID: 351727428, folder: "Finance", symbol: "dollarsign.circle.fill", colorHex: 0x008CFF),
        KnownApp(id: "paypal", name: "PayPal", scheme: "paypal", appStoreID: 283646709, folder: "Finance", symbol: "creditcard.fill", colorHex: 0x003087),
        KnownApp(id: "strava", name: "Strava", scheme: "strava", appStoreID: 426826309, folder: "Health", symbol: "figure.run", colorHex: 0xFC4C02),
    ]
}
