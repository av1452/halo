import Foundation

@MainActor @Observable
final class LauncherStore {
    struct State: Codable, Equatable {
        var shortcuts: [Shortcut]
        var recents: [UUID] = []
        /// Detected apps the user removed, so they aren't added back
        var dismissedKnownApps: [String] = []

        init(shortcuts: [Shortcut], recents: [UUID] = [], dismissedKnownApps: [String] = []) {
            self.shortcuts = shortcuts
            self.recents = recents
            self.dismissedKnownApps = dismissedKnownApps
        }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            shortcuts = try c.decode([Shortcut].self, forKey: .shortcuts)
            recents = (try? c.decode([UUID].self, forKey: .recents)) ?? []
            dismissedKnownApps = (try? c.decode([String].self, forKey: .dismissedKnownApps)) ?? []
        }
    }

    struct SyncResult: Equatable {
        var added: [String] = []
        var removed: [String] = []
    }

    private(set) var state: State { didSet { if state != oldValue { store.save(state) } } }
    private let store: JSONStore<State>

    init(store: JSONStore<State>) {
        self.store = store
        // Drop entries whose URL no longer passes validation
        let loaded = store.load().map { saved in
            State(shortcuts: saved.shortcuts.filter { ShortcutURL.normalize($0.url) != nil }, recents: saved.recents, dismissedKnownApps: saved.dismissedKnownApps)
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
        // Remember detected apps the user removed so syncing doesn't add them back
        let dismissed = state.shortcuts.filter { ids.contains($0.id) }.compactMap(\.knownAppID)
        state.dismissedKnownApps = Array(Set(state.dismissedKnownApps + dismissed)).sorted()
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

    /// Replaces everything, dropping shortcuts whose URL fails validation.
    func replace(with state: State) {
        self.state = State(shortcuts: state.shortcuts.filter { ShortcutURL.normalize($0.url) != nil }, recents: state.recents, dismissedKnownApps: state.dismissedKnownApps)
    }

    var hiddenDetectedApps: [KnownApp] { KnownApps.all.filter { state.dismissedKnownApps.contains($0.id) } }

    /// Lets previously removed detected apps come back on the next sync.
    func showHiddenDetectedApps() { state.dismissedKnownApps = [] }

    /// Mirrors installed apps from KnownApps: adds ones that are installed (unless
    /// the user removed them) and removes auto-added ones that were uninstalled.
    /// Shortcuts the user made themselves are never touched.
    @discardableResult
    func syncInstalled(isInstalled: (KnownApp) -> Bool) -> SyncResult {
        var result = SyncResult()
        var shortcuts = state.shortcuts
        for app in KnownApps.all {
            let installed = isInstalled(app)
            let index = shortcuts.firstIndex { $0.knownAppID == app.id }
            if installed, index == nil, !state.dismissedKnownApps.contains(app.id) {
                shortcuts.append(app.shortcut())
                result.added.append(app.id)
            } else if !installed, let index, shortcuts[index].autoAdded == true {
                state.recents.removeAll { $0 == shortcuts[index].id }
                shortcuts.remove(at: index)
                result.removed.append(app.id)
            }
        }
        if shortcuts != state.shortcuts { state.shortcuts = shortcuts }
        return result
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
