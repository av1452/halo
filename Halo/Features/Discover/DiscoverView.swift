import SwiftUI

struct DiscoverView: View {
    @Binding var query: String
    @Environment(AppModel.self) private var model
    @State private var category: DiscoverCategory?
    @State private var selection: DiscoverStore.SavedApp?
    @State private var live: LiveSearch?

    struct LiveSearch: Equatable {
        var term: String
        var results: [StoreApp] = []
        var error: String?
        var loading = true
    }

    var body: some View {
        let store = model.discover
        let picks = DiscoverCatalog.all.filter { (category == nil || $0.category == category) && DiscoverCatalog.matches($0, query) }
        let browsing = query.isEmpty && category == nil

        if !query.trimmingCharacters(in: .whitespaces).isEmpty {
            Button("Search the App Store for “\(query)”", systemImage: "magnifyingglass") { Task { await searchStore() } }
                .buttonStyle(.glassProminent)
            Text("Halo’s picks are filtered on your device. App Store search sends your search term to Apple.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }

        if let live, live.term == query.trimmingCharacters(in: .whitespaces) {
            SectionGroup(title: "App Store Results") {
                if live.loading {
                    ProgressView().frame(maxWidth: .infinity)
                } else if let error = live.error {
                    Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.red)
                } else if live.results.isEmpty {
                    Text("No results.").foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 10) {
                        ForEach(live.results) { app in
                            ListingRow(name: app.name, developer: app.developer, detail: [app.genre, app.price].filter { !$0.isEmpty }.joined(separator: " · "), iconURL: app.iconURL) {
                                model.discover.details[app.id] = app
                                selection = .init(id: app.id, name: app.name, developer: app.developer, iconURL: app.iconURL)
                            }
                        }
                    }
                }
            }
        }

        if browsing {
            SectionGroup(title: "Featured") {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(DiscoverCatalog.all.filter(\.featured)) { listing in
                            FeaturedCard(listing: listing) { selection = saved(listing) }
                        }
                    }
                }
                .scrollClipDisabled()
            }
        }

        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                FilterChip(title: "All", isSelected: category == nil) { category = nil }
                ForEach(DiscoverCategory.allCases) { c in FilterChip(title: c.title, isSelected: category == c) { category = c } }
            }
        }
        .scrollClipDisabled()

        if browsing, !store.state.favorites.isEmpty {
            SectionGroup(title: "Favorites") {
                VStack(spacing: 10) {
                    ForEach(store.state.favorites) { app in
                        ListingRow(name: app.name, developer: app.developer, iconURL: app.iconURL) { selection = app }
                    }
                }
            }
        }

        SectionGroup(title: category?.title ?? "Halo Picks") {
            if picks.isEmpty {
                ContentUnavailableView("No Matching Picks", systemImage: "magnifyingglass", description: Text("Halo’s list is small and hand-picked. Try searching the App Store."))
                    .glassEffect(in: .rect(cornerRadius: 26))
            } else {
                VStack(spacing: 10) {
                    ForEach(picks) { listing in
                        ListingRow(name: listing.name, developer: listing.developer, detail: listing.category.title, iconURL: store.details[listing.id]?.iconURL) {
                            selection = saved(listing)
                        }
                    }
                }
            }
            Text("A manually maintained list, not paid placements or live rankings.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .task { await loadCatalogDetails() }
        .sheet(item: $selection) { AppDetailView(app: $0) }
    }

    private func saved(_ listing: Listing) -> DiscoverStore.SavedApp {
        .init(id: listing.id, name: listing.name, developer: listing.developer, iconURL: model.discover.details[listing.id]?.iconURL)
    }

    /// One lookup request fetches icons and details for every pick.
    private func loadCatalogDetails() async {
        guard model.discover.details.isEmpty else { return }
        if let apps = try? await model.appStore.lookup(DiscoverCatalog.all.map(\.id)) {
            for app in apps { model.discover.details[app.id] = app }
        }
    }

    private func searchStore() async {
        let term = query.trimmingCharacters(in: .whitespaces)
        guard !term.isEmpty else { return }
        live = LiveSearch(term: term)
        do {
            live = LiveSearch(term: term, results: try await model.appStore.search(term), loading: false)
        } catch {
            live = LiveSearch(term: term, error: error.localizedDescription, loading: false)
        }
    }
}

struct StoreIcon: View {
    let url: URL?
    var size: CGFloat = 56
    let name: String

    var body: some View {
        AsyncImage(url: url) { image in
            image.resizable().scaledToFill()
        } placeholder: {
            Text(String(name.prefix(1))).font(.system(size: size * 0.45, weight: .bold, design: .rounded)).foregroundStyle(.white)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.accentColor.gradient)
        }
        .frame(width: size, height: size)
        .clipShape(.rect(cornerRadius: size * 0.235, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: size * 0.235, style: .continuous).strokeBorder(.primary.opacity(0.08)) }
        .accessibilityHidden(true)
    }
}

private struct ListingRow: View {
    let name: String
    let developer: String
    var detail: String?
    let iconURL: URL?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                StoreIcon(url: iconURL, name: name)
                VStack(alignment: .leading, spacing: 2) {
                    Text(name).font(.headline).lineLimit(1)
                    Text(developer).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                    if let detail { Text(detail).font(.caption).foregroundStyle(.secondary) }
                }
                Spacer()
                Image(systemName: "chevron.right").font(.footnote.bold()).foregroundStyle(.tertiary)
            }
            .padding(12)
            .contentShape(.rect)
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 22))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
    }
}

private struct FeaturedCard: View {
    let listing: Listing
    let action: () -> Void
    @Environment(AppModel.self) private var model

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                StoreIcon(url: model.discover.details[listing.id]?.iconURL, size: 64, name: listing.name)
                Text(listing.name).font(.headline)
                Text(listing.summary).font(.subheadline).foregroundStyle(.secondary).lineLimit(3)
                Spacer(minLength: 0)
            }
            .frame(width: 230, height: 190, alignment: .topLeading)
            .padding(16)
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 26))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
    }
}
