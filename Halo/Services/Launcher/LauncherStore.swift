import Foundation

@MainActor @Observable
final class LauncherStore {
    struct State: Codable, Equatable {
        var shortcuts: [Shortcut]
        var recents: [UUID] = []
    }

    private(set) var state: State { didSet { if state != oldValue { store.save(state) } } }
    private let store: JSONStore<State>

    init(store: JSONStore<State>) {
        self.store = store
        // Drop entries whose URL no longer passes validation
        let loaded = store.load().map { saved in
            State(shortcuts: saved.shortcuts.filter { ShortcutURL.normalize($0.url) != nil }, recents: saved.recents)
        }
        state = loaded ?? State(shortcuts: AppleApps.defaults())
    }

    var shortcuts: [Shortcut] { state.shortcuts }
    var folders: [String] { Array(Set(state.shortcuts.compactMap(\.folder))).sorted() }
    var recentShortcuts: [Shortcut] { state.recents.compactMap { id in state.shortcuts.first { $0.id == id } } }

    func add(_ shortcut: Shortcut) { state.shortcuts.append(shortcut) }

    func update(_ shortcut: Shortcut) {
        guard let i = state.shortcuts.firstIndex(where: { $0.id == shortcut.id }) else { return }
        state.shortcuts[i] = shortcut
    }

    func remove(_ ids: Set<UUID>) {
        state.shortcuts.removeAll { ids.contains($0.id) }
        state.recents.removeAll { ids.contains($0) }
    }

    func move(from offsets: IndexSet, to destination: Int) {
        state.shortcuts.move(fromOffsets: offsets, toOffset: destination)
    }

    func toggleFavorite(_ id: UUID) {
        guard let i = state.shortcuts.firstIndex(where: { $0.id == id }) else { return }
        state.shortcuts[i].isFavorite.toggle()
    }

    func recordOpen(_ id: UUID) {
        state.recents = Array(([id] + state.recents.filter { $0 != id }).prefix(8))
    }

    func restoreAppleApps() {
        let existing = Set(state.shortcuts.filter(\.isAppleApp).map(\.name))
        state.shortcuts += AppleApps.defaults().filter { !existing.contains($0.name) }
    }

    func reset() {
        store.remove()
        state = State(shortcuts: AppleApps.defaults())
    }

    func filtered(query: String, folder: String?, favoritesOnly: Bool) -> [Shortcut] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return state.shortcuts.filter { s in
            (!favoritesOnly || s.isFavorite)
                && (folder == nil || s.folder == folder)
                && (q.isEmpty || s.name.lowercased().contains(q) || s.url.lowercased().contains(q))
        }
    }
}
