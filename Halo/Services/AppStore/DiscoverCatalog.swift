import Foundation

/// Curated, manually maintained picks. App Store IDs were checked against
/// Apple's lookup API on 2026-10-19; summaries are Halo's own words.
struct Listing: Identifiable, Hashable, Sendable {
    let id: Int
    let name: String
    let developer: String
    let category: DiscoverCategory
    let summary: String
    var featured = false
}

enum DiscoverCategory: String, CaseIterable, Identifiable, Sendable {
    case productivity, listening, learning, photo, health, travel, security, smartHome, social
    var id: String { rawValue }
    var title: String {
        switch self {
        case .productivity: "Productivity"
        case .listening: "Podcasts & Music"
        case .learning: "Learning & Reading"
        case .photo: "Photo & Video"
        case .health: "Health & Fitness"
        case .travel: "Maps & Travel"
        case .security: "Privacy & Security"
        case .smartHome: "Smart Home"
        case .social: "Social & Web"
        }
    }
}

enum DiscoverCatalog {
    static let all: [Listing] = [
        Listing(id: 904237743, name: "Things 3", developer: "Cultured Code", category: .productivity, summary: "A calm, beautifully designed task manager built around Today, Upcoming and projects.", featured: true),
        Listing(id: 1232780281, name: "Notion", developer: "Notion Labs", category: .productivity, summary: "Notes, docs, wikis and databases in one flexible workspace."),
        Listing(id: 572688855, name: "Todoist", developer: "Doist", category: .productivity, summary: "Cross-platform to-do lists with natural-language dates."),
        Listing(id: 718043190, name: "Fantastical", developer: "Flexibits", category: .productivity, summary: "A calendar and tasks app with quick natural-language event entry."),
        Listing(id: 1044867788, name: "Day One", developer: "Bloom Built", category: .productivity, summary: "A private journal with photos, locations and end-to-end encrypted sync."),
        Listing(id: 888422857, name: "Overcast", developer: "Overcast Radio", category: .listening, summary: "A podcast player known for Smart Speed and Voice Boost.", featured: true),
        Listing(id: 414834813, name: "Pocket Casts", developer: "Automattic", category: .listening, summary: "A podcast player that syncs across phone, web and desktop."),
        Listing(id: 284993459, name: "Shazam", developer: "Apple", category: .listening, summary: "Identify the song that’s playing around you."),
        Listing(id: 570060128, name: "Duolingo", developer: "Duolingo", category: .learning, summary: "Short, game-like lessons for learning a new language.", featured: true),
        Listing(id: 1076402606, name: "Libby", developer: "OverDrive", category: .learning, summary: "Borrow ebooks and audiobooks free with a library card."),
        Listing(id: 302584613, name: "Kindle", developer: "Amazon", category: .learning, summary: "Read Kindle books on iPhone and iPad."),
        Listing(id: 324715238, name: "Wikipedia", developer: "Wikimedia Foundation", category: .learning, summary: "The free encyclopedia, with offline reading lists."),
        Listing(id: 885697368, name: "Halide", developer: "Lux Optics", category: .photo, summary: "A pro camera with manual controls and RAW capture.", featured: true),
        Listing(id: 953286746, name: "Darkroom", developer: "Bergen Co.", category: .photo, summary: "Photo and video editing that works directly on your library."),
        Listing(id: 493145008, name: "Headspace", developer: "Headspace", category: .health, summary: "Guided meditation, sleep sounds and mindfulness courses."),
        Listing(id: 426826309, name: "Strava", developer: "Strava", category: .health, summary: "Track runs and rides and follow friends’ activities."),
        Listing(id: 585027354, name: "Google Maps", developer: "Google", category: .travel, summary: "Maps, directions, transit and place reviews."),
        Listing(id: 469463298, name: "Citymapper", developer: "Citymapper", category: .travel, summary: "Real-time transit directions for major cities."),
        Listing(id: 1511601750, name: "1Password", developer: "AgileBits", category: .security, summary: "A password manager with passkeys and secure sharing."),
        Listing(id: 1137397744, name: "Bitwarden", developer: "Bitwarden", category: .security, summary: "An open-source password manager with a free tier.", featured: true),
        Listing(id: 874139669, name: "Signal", developer: "Signal Messenger", category: .security, summary: "End-to-end encrypted messaging and calls."),
        Listing(id: 1099568401, name: "Home Assistant", developer: "Nabu Casa", category: .smartHome, summary: "Companion app for the open-source Home Assistant platform.", featured: true),
        Listing(id: 1055281310, name: "Philips Hue", developer: "Signify", category: .smartHome, summary: "Control Hue lights, scenes and automations."),
        Listing(id: 1480640210, name: "NetNewsWire", developer: "Brent Simmons", category: .social, summary: "A free, open-source RSS reader."),
        Listing(id: 989804926, name: "Firefox", developer: "Mozilla", category: .social, summary: "Mozilla’s browser with tracking protection and sync."),
        Listing(id: 6444602274, name: "Ivory", developer: "Tapbots", category: .social, summary: "A polished Mastodon client."),
    ]

    static func matches(_ listing: Listing, _ query: String) -> Bool {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return q.isEmpty || [listing.name, listing.developer, listing.summary, listing.category.title].contains { $0.lowercased().contains(q) }
    }
}

/// Favorites and recently viewed apps, with enough info to show them offline.
@MainActor @Observable
final class DiscoverStore {
    struct SavedApp: Codable, Hashable, Identifiable {
        let id: Int
        var name: String
        var developer: String
        var iconURL: URL?
    }

    struct State: Codable, Equatable {
        var favorites: [SavedApp] = []
        var recents: [SavedApp] = []
    }

    private(set) var state: State { didSet { if state != oldValue { store.save(state) } } }
    private let store: JSONStore<State>
    /// Live details from Apple, keyed by App Store ID (not persisted)
    var details: [Int: StoreApp] = [:]

    init(store: JSONStore<State>) {
        self.store = store
        state = store.load() ?? State()
    }

    func isFavorite(_ id: Int) -> Bool { state.favorites.contains { $0.id == id } }

    func toggleFavorite(_ app: SavedApp) {
        if isFavorite(app.id) { state.favorites.removeAll { $0.id == app.id } } else { state.favorites.insert(app, at: 0) }
    }

    func recordViewed(_ app: SavedApp) {
        state.recents = Array(([app] + state.recents.filter { $0.id != app.id }).prefix(10))
    }

    func reset() {
        store.remove()
        state = State()
    }
}
