import SwiftUI

struct AppDetailView: View {
    let app: DiscoverStore.SavedApp
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var adding = false
    @State private var error: String?

    var body: some View {
        let detail = model.discover.details[app.id]
        let listing = DiscoverCatalog.all.first { $0.id == app.id }
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 16) {
                        StoreIcon(url: detail?.iconURL ?? app.iconURL, size: 88, name: app.name)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(app.name).font(.title2.bold())
                            Text(detail?.developer ?? app.developer).foregroundStyle(.secondary)
                            if let detail {
                                Text([detail.genre, detail.price, detail.rating.map { "★ \($0.formatted(.number.precision(.fractionLength(1))))" }].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    GlassEffectContainer {
                        HStack {
                            Button("View in App Store", systemImage: "bag.fill") {
                                Task { await StoreProductPresenter.present(appStoreID: app.id) }
                            }
                            .buttonStyle(.glassProminent)
                            Button(model.discover.isFavorite(app.id) ? "Favorited" : "Favorite", systemImage: model.discover.isFavorite(app.id) ? "star.fill" : "star") {
                                model.discover.toggleFavorite(.init(id: app.id, name: app.name, developer: app.developer, iconURL: detail?.iconURL ?? app.iconURL))
                            }
                            .buttonStyle(.glass)
                            Button("Add to Apps", systemImage: "plus") { adding = true }
                                .buttonStyle(.glass)
                                .labelStyle(.iconOnly)
                        }
                    }
                    Text("Installing happens in the App Store. Halo never installs apps itself.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    if let summary = listing?.summary { Text(summary) }

                    if let shots = detail?.screenshotURLs, !shots.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(Array(shots.enumerated()), id: \.offset) { index, url in
                                    AsyncImage(url: url) { $0.resizable().scaledToFit() } placeholder: { Color.secondary.opacity(0.15) }
                                        .frame(height: 360)
                                        .clipShape(.rect(cornerRadius: 18))
                                        .accessibilityLabel("\(app.name) screenshot \(index + 1)")
                                }
                            }
                        }
                        .scrollClipDisabled()
                    } else if detail == nil, error == nil {
                        ProgressView("Loading App Store details…")
                    }
                    if let error { Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.red) }
                    if let description = detail?.summary, !description.isEmpty {
                        DisclosureGroup("Description from the App Store") {
                            Text(description).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    if detail != nil {
                        Text("Icon, screenshots, rating and description are provided by Apple’s App Store.")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
                .padding()
            }
            .background { Wallpaper(style: model.settings.value.wallpaper) }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done", systemImage: "checkmark") { dismiss() } }
            }
        }
        .task { await load() }
        .sheet(isPresented: $adding) {
            ShortcutEditor(shortcut: nil, prefill: Shortcut(name: app.name, url: StoreProductPresenter.appStoreURL(app.id).absoluteString, symbol: "bag.fill", colorHex: 0x0A84FF, appStoreID: app.id))
        }
    }

    private func load() async {
        model.discover.recordViewed(app)
        // Search results already carry screenshots; curated picks need a lookup
        guard model.discover.details[app.id]?.screenshotURLs.isEmpty ?? true else { return }
        do {
            if let fetched = try await model.appStore.lookup([app.id]).first {
                model.discover.details[app.id] = fetched
            } else {
                error = "This app isn’t available in your region’s App Store."
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
