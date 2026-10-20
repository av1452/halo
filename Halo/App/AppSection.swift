import SwiftUI

/// The top-level sections of Halo, in tab order.
enum AppSection: String, CaseIterable, Identifiable, Hashable {
    case home, apps, smartHome, media, discover, settings, search

    var id: String { rawValue }

    /// Sections shown as tabs. Discover lives inside Apps; search and settings
    /// are presented separately so iPhone shows every tab without "More".
    static let tabs: [AppSection] = [.home, .apps, .smartHome, .media]

    var title: String {
        switch self {
        case .home: "Home"
        case .apps: "Apps"
        case .smartHome: "Smart Home"
        case .media: "Media"
        case .discover: "Discover"
        case .settings: "Settings"
        case .search: "Search"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "house"
        case .apps: "square.grid.2x2"
        case .smartHome: "lightbulb.2"
        case .media: "music.note"
        case .discover: "safari"
        case .settings: "gearshape"
        case .search: "magnifyingglass"
        }
    }
}
