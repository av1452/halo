import SwiftUI

/// The search tab: finds Halo's own content (not the whole device).
struct SearchView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.selectSection) private var selectSection
    @Environment(\.openSettings) private var openSettings
    @State private var query = ""
    @State private var device: String?
    @State private var listing: DiscoverStore.SavedApp?
    @State private var confirmation: String?

    var body: some View {
        let index = SearchIndex.build(shortcuts: model.launcher.shortcuts, home: model.smartHome.provider.snapshot, widgets: model.dashboard.items)
        let groups = SearchIndex.search(index, query)

        NavigationStack {
            List {
                if query.trimmingCharacters(in: .whitespaces).isEmpty {
                    Section {
                        Text("Search your apps and shortcuts, smart-home devices, rooms and scenes, Discover picks, widgets and settings. Halo searches its own content, not your whole device.")
                            .foregroundStyle(.secondary)
                    }
                } else if groups.isEmpty {
                    ContentUnavailableView.search(text: query)
                }
                if let confirmation {
                    Label(confirmation, systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                }
                ForEach(groups, id: \.group) { group in
                    Section(group.group.rawValue) {
                        ForEach(group.items) { item in
                            Button { run(item.action) } label: {
                                Label {
                                    VStack(alignment: .leading) {
                                        Text(item.title).foregroundStyle(.primary)
                                        if !item.subtitle.isEmpty { Text(item.subtitle).font(.caption).foregroundStyle(.secondary) }
                                    }
                                } icon: {
                                    Image(systemName: item.systemImage)
                                }
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background { Wallpaper(style: model.settings.value.wallpaper) }
            .navigationTitle("Search")
            .searchable(text: $query, prompt: "Apps, devices, scenes, settings…")
            .onChange(of: query) { confirmation = nil }
        }
        .sheet(item: Binding(get: { device.map(DeviceRef.init) }, set: { device = $0?.id })) { DeviceDetailView(deviceID: $0.id) }
        .sheet(item: $listing) { AppDetailView(app: $0) }
    }

    private struct DeviceRef: Identifiable { let id: String }

    private func run(_ action: SearchItem.Action) {
        switch action {
        case .openShortcut(let id):
            if let shortcut = model.launcher.shortcuts.first(where: { $0.id == id }) { Task { await model.opener.open(shortcut) } }
        case .showDevice(let id):
            device = id
        case .runScene(let id, let name):
            Task {
                await model.smartHome.provider.activateScene(id)
                confirmation = "\(name) set" + (model.smartHome.provider.isSimulated ? " (demo)" : "")
            }
        case .showRoom:
            selectSection(.smartHome)
        case .showListing(let id):
            if let l = DiscoverCatalog.all.first(where: { $0.id == id }) {
                listing = .init(id: l.id, name: l.name, developer: l.developer, iconURL: model.discover.details[l.id]?.iconURL)
            }
        case .goTo(let section):
            selectSection(section)
        case .openSettings:
            openSettings()
        }
    }
}
