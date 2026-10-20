import Foundation

enum DashboardWidget: String, Codable, CaseIterable, Identifiable {
    case clock, weather, calendar, reminders, smartHome, favorites, nowPlaying, quickActions, notes

    var id: String { rawValue }

    var title: String {
        switch self {
        case .clock: "Clock"
        case .weather: "Weather"
        case .calendar: "Calendar"
        case .reminders: "Reminders"
        case .smartHome: "Smart Home"
        case .favorites: "Favorite Apps"
        case .nowPlaying: "Now Playing"
        case .quickActions: "Quick Actions"
        case .notes: "Notes"
        }
    }

    var systemImage: String {
        switch self {
        case .clock: "clock"
        case .weather: "cloud.sun"
        case .calendar: "calendar"
        case .reminders: "checklist"
        case .smartHome: "lightbulb.2"
        case .favorites: "star"
        case .nowPlaying: "music.note"
        case .quickActions: "bolt"
        case .notes: "note.text"
        }
    }
}

struct DashboardItem: Codable, Equatable, Identifiable {
    var widget: DashboardWidget
    var isWide: Bool
    var id: DashboardWidget { widget }
}

/// Which widgets the Home dashboard shows, in what order and size.
@MainActor @Observable
final class DashboardStore {
    static let defaultLayout: [DashboardItem] = [
        .init(widget: .clock, isWide: false), .init(widget: .weather, isWide: false),
        .init(widget: .calendar, isWide: false), .init(widget: .reminders, isWide: false),
        .init(widget: .smartHome, isWide: true), .init(widget: .favorites, isWide: true),
        .init(widget: .nowPlaying, isWide: false), .init(widget: .quickActions, isWide: false),
    ]

    private(set) var items: [DashboardItem] { didSet { if items != oldValue { store.save(items) } } }
    private let store: JSONStore<[DashboardItem]>

    init(store: JSONStore<[DashboardItem]>) {
        self.store = store
        // One of each widget; unknown or duplicate entries are dropped by decoding/filtering
        var seen = Set<DashboardWidget>()
        items = (LaunchOptions.dashboardWidgets ?? store.load() ?? Self.defaultLayout).filter { seen.insert($0.widget).inserted }
    }

    var hidden: [DashboardWidget] { DashboardWidget.allCases.filter { w in !items.contains { $0.widget == w } } }

    func add(_ widget: DashboardWidget) {
        guard !items.contains(where: { $0.widget == widget }) else { return }
        items.append(.init(widget: widget, isWide: false))
    }

    func remove(_ widget: DashboardWidget) { items.removeAll { $0.widget == widget } }
    func move(from offsets: IndexSet, to destination: Int) { items.move(fromOffsets: offsets, toOffset: destination) }

    func toggleWide(_ widget: DashboardWidget) {
        guard let i = items.firstIndex(where: { $0.widget == widget }) else { return }
        items[i].isWide.toggle()
    }

    func replace(with items: [DashboardItem]) {
        var seen = Set<DashboardWidget>()
        self.items = items.filter { seen.insert($0.widget).inserted }
    }

    func reset() {
        store.remove()
        items = Self.defaultLayout
    }

    /// Groups widgets into rows for a grid with `columns` columns: wide widgets
    /// take a whole row, regular ones fill rows left to right.
    static func rows(for items: [DashboardItem], columns: Int) -> [[DashboardItem]] {
        guard columns > 1 else { return items.map { [$0] } }
        var rows: [[DashboardItem]] = []
        var current: [DashboardItem] = []
        for item in items {
            if item.isWide {
                if !current.isEmpty { rows.append(current); current = [] }
                rows.append([item])
            } else {
                current.append(item)
                if current.count == columns { rows.append(current); current = [] }
            }
        }
        if !current.isEmpty { rows.append(current) }
        return rows
    }
}

@MainActor @Observable
final class NotesStore {
    var text: String { didSet { if text != oldValue { store.save(text) } } }
    private let store: JSONStore<String>

    init(store: JSONStore<String>) {
        self.store = store
        text = store.load() ?? ""
    }

    func reset() {
        store.remove()
        text = ""
    }
}
