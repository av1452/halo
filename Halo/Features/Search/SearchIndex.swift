import Foundation

/// Something Halo can find, and what selecting it does.
struct SearchItem: Identifiable, Equatable {
    enum Group: String, CaseIterable {
        case apps = "Apps", smartHome = "Smart Home", discover = "Discover", home = "Home", settings = "Settings"
    }

    enum Action: Equatable {
        case openShortcut(UUID)
        case showDevice(String)
        case runScene(String, name: String)
        case showRoom(String)
        case showListing(Int)
        case goTo(AppSection)
        case openSettings
    }

    let id: String
    let group: Group
    let title: String
    var subtitle: String = ""
    var keywords: String = ""
    let systemImage: String
    let action: Action
}

enum SearchIndex {
    static func build(shortcuts: [Shortcut], home: HomeSnapshot, widgets: [DashboardItem]) -> [SearchItem] {
        var items: [SearchItem] = []
        for s in shortcuts {
            items.append(SearchItem(id: "app-\(s.id)", group: .apps, title: s.name, subtitle: s.isAppleApp ? "Apple app" : (s.folder.map { "Shortcut · \($0)" } ?? "Shortcut"),
                                    keywords: s.url, systemImage: s.symbol, action: .openShortcut(s.id)))
        }
        for d in home.devices {
            let room = home.rooms.first { $0.id == d.roomID }?.name ?? ""
            items.append(SearchItem(id: "device-\(d.id)", group: .smartHome, title: d.name, subtitle: room, keywords: "device accessory", systemImage: d.systemImage, action: .showDevice(d.id)))
        }
        for r in home.rooms {
            items.append(SearchItem(id: "room-\(r.id)", group: .smartHome, title: r.name, subtitle: "Room", systemImage: "square.split.bottomrightquarter", action: .showRoom(r.id)))
        }
        for scene in home.scenes {
            items.append(SearchItem(id: "scene-\(scene.id)", group: .smartHome, title: scene.name, subtitle: "Scene · runs now", keywords: "scene", systemImage: scene.systemImage, action: .runScene(scene.id, name: scene.name)))
        }
        for l in DiscoverCatalog.all {
            items.append(SearchItem(id: "discover-\(l.id)", group: .discover, title: l.name, subtitle: "\(l.developer) · \(l.category.title)", keywords: l.summary, systemImage: "bag", action: .showListing(l.id)))
        }
        for w in DashboardWidget.allCases {
            let shown = widgets.contains { $0.widget == w }
            items.append(SearchItem(id: "widget-\(w.rawValue)", group: .home, title: w.title, subtitle: shown ? "Widget on Home" : "Widget · not on Home", keywords: "widget dashboard", systemImage: w.systemImage, action: .goTo(.home)))
        }
        let settings: [(String, String, String)] = [
            ("Appearance", "theme dark light mode accent color wallpaper", "paintbrush"),
            ("Profile", "name greeting", "person"),
            ("Units", "temperature celsius fahrenheit", "thermometer"),
            ("Smart Home Source", "homekit apple home demo", "house"),
            ("Data & Backup", "export import backup reset erase", "externaldrive"),
            ("Privacy", "privacy data permissions network", "hand.raised"),
        ]
        for (title, keywords, symbol) in settings {
            items.append(SearchItem(id: "settings-\(title)", group: .settings, title: title, subtitle: "Settings", keywords: keywords, systemImage: symbol, action: .openSettings))
        }
        return items
    }

    /// Higher is better; 0 means no match.
    static func score(_ item: SearchItem, _ query: String) -> Int {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return 0 }
        let title = item.title.lowercased()
        if title == q { return 100 }
        if title.hasPrefix(q) { return 80 }
        let separators = CharacterSet.whitespaces.union(CharacterSet(charactersIn: "-·/.:"))
        if title.components(separatedBy: separators).contains(where: { $0.hasPrefix(q) }) { return 60 }
        if title.contains(q) { return 40 }
        let rest = "\(item.subtitle) \(item.keywords)".lowercased()
        if rest.components(separatedBy: separators).contains(where: { $0.hasPrefix(q) }) { return 20 }
        if rest.contains(q) { return 10 }
        return 0
    }

    static func search(_ items: [SearchItem], _ query: String, perGroup: Int = 6) -> [(group: SearchItem.Group, items: [SearchItem])] {
        let scored = items.map { ($0, score($0, query)) }.filter { $0.1 > 0 }
        return SearchItem.Group.allCases.compactMap { group in
            let matches = scored.filter { $0.0.group == group }
                .sorted { $0.1 != $1.1 ? $0.1 > $1.1 : $0.0.title < $1.0.title }
                .prefix(perGroup)
                .map(\.0)
            return matches.isEmpty ? nil : (group, Array(matches))
        }
    }
}
