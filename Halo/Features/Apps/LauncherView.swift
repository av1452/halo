import SwiftUI

/// "My Apps": Apple's apps plus your own shortcuts.
struct LauncherView: View {
    @Binding var query: String
    @Environment(AppModel.self) private var model
    @State private var filter: Filter = .all
    @State private var editing: Shortcut?
    @State private var adding = false
    @State private var arranging = false

    enum Filter: Hashable { case all, favorites, folder(String) }

    private let columns = [GridItem(.adaptive(minimum: 68), spacing: 8)]

    var body: some View {
        let launcher = model.launcher
        let shortcuts = launcher.filtered(query: query, folder: folderName, favoritesOnly: filter == .favorites)

        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                FilterChip(title: "All", isSelected: filter == .all) { filter = .all }
                FilterChip(title: "Favorites", isSelected: filter == .favorites) { filter = .favorites }
                ForEach(launcher.folders, id: \.self) { folder in
                    FilterChip(title: folder, isSelected: filter == .folder(folder)) { filter = .folder(folder) }
                }
            }
        }
        .scrollClipDisabled()

        if query.isEmpty, filter == .all, !launcher.recentShortcuts.isEmpty {
            SectionGroup(title: "Recently Opened") {
                LazyVGrid(columns: columns, spacing: 18) {
                    ForEach(launcher.recentShortcuts.prefix(4)) { ShortcutTile(shortcut: $0, edit: { editing = $0 }) }
                }
                .padding(16)
                .glassEffect(in: .rect(cornerRadius: 28))
            }
        }

        SectionGroup(title: "All Apps") {
            if shortcuts.isEmpty {
                ContentUnavailableView.search(text: query)
                    .glassEffect(in: .rect(cornerRadius: 28))
            } else {
                LazyVGrid(columns: columns, spacing: 18) {
                    ForEach(shortcuts) { ShortcutTile(shortcut: $0, edit: { editing = $0 }) }
                }
                .padding(16)
                .glassEffect(in: .rect(cornerRadius: 28))
            }
        } trailing: {
            Menu("Manage", systemImage: "ellipsis") {
                Button("Add Shortcut", systemImage: "plus") { adding = true }
                Button("Arrange", systemImage: "arrow.up.arrow.down") { arranging = true }
                Button("Restore Apple Apps", systemImage: "apple.logo") { launcher.restoreAppleApps() }
            }
            .labelStyle(.iconOnly)
            .buttonStyle(.glass)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Add Shortcut", systemImage: "plus") { adding = true }
            }
        }
        .sheet(isPresented: $adding) { ShortcutEditor(shortcut: nil) }
        .sheet(item: $editing) { ShortcutEditor(shortcut: $0) }
        .sheet(isPresented: $arranging) { ArrangeView() }
        .alert(
            "Couldn’t Open \(model.opener.failed?.name ?? "App")",
            isPresented: Binding(get: { model.opener.failed != nil }, set: { if !$0 { model.opener.failed = nil } }),
            presenting: model.opener.failed
        ) { shortcut in
            if let id = shortcut.appStoreID {
                Button("View in App Store") { Task { await StoreProductPresenter.present(appStoreID: id) } }
            }
            Button("OK", role: .cancel) {}
        } message: { shortcut in
            Text(shortcut.appStoreID == nil ? "Check the address, or that the app is installed." : "It may not be installed on this device.")
        }
    }

    private var folderName: String? {
        if case .folder(let name) = filter { name } else { nil }
    }
}

private struct ShortcutTile: View {
    let shortcut: Shortcut
    let edit: (Shortcut) -> Void
    @Environment(AppModel.self) private var model

    var body: some View {
        let installed = model.opener.isInstalled(shortcut)
        Button {
            Task { await model.opener.open(shortcut) }
        } label: {
            VStack(spacing: 6) {
                AppIconView(symbol: shortcut.symbol, colorHex: shortcut.colorHex)
                    .overlay(alignment: .topTrailing) {
                        if !installed {
                            Image(systemName: "icloud.and.arrow.down.fill")
                                .font(.caption)
                                .padding(4)
                                .glassEffect(in: .circle)
                                .offset(x: 6, y: -6)
                        }
                    }
                Group {
                    if shortcut.isFavorite {
                        Text("\(shortcut.name) \(Image(systemName: "star.fill").renderingMode(.original))")
                    } else {
                        Text(shortcut.name)
                    }
                }
                .font(.caption.weight(.medium))
                .lineLimit(2)
                .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(shortcut.name)
        .accessibilityValue([shortcut.isFavorite ? "Favorite" : nil, installed ? nil : "Not installed"].compactMap { $0 }.joined(separator: ", "))
        .contextMenu {
            Button("Open", systemImage: "arrow.up.forward.app") { Task { await model.opener.open(shortcut) } }
            Button(shortcut.isFavorite ? "Unfavorite" : "Favorite", systemImage: shortcut.isFavorite ? "star.slash" : "star") {
                model.launcher.toggleFavorite(shortcut.id)
            }
            Button("Edit", systemImage: "pencil") { edit(shortcut) }
            if let id = shortcut.appStoreID {
                Button("View in App Store", systemImage: "bag") { Task { await StoreProductPresenter.present(appStoreID: id) } }
            }
            Button("Remove", systemImage: "trash", role: .destructive) { model.launcher.remove([shortcut.id]) }
        }
    }
}

/// Reorder and delete shortcuts with the standard list editing controls.
private struct ArrangeView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                ForEach(model.launcher.shortcuts) { shortcut in
                    Label {
                        Text(shortcut.name)
                    } icon: {
                        AppIconView(symbol: shortcut.symbol, colorHex: shortcut.colorHex, size: 30)
                    }
                }
                .onMove { model.launcher.move(from: $0, to: $1) }
                .onDelete { offsets in model.launcher.remove(Set(offsets.map { model.launcher.shortcuts[$0].id })) }
            }
            .environment(\.editMode, .constant(.active))
            .navigationTitle("Arrange")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done", systemImage: "checkmark") { dismiss() } }
            }
        }
    }
}
