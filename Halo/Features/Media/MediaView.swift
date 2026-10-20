import SwiftUI

struct MediaView: View {
    @Environment(AppModel.self) private var model

    private static let mediaApps = ["Music", "Podcasts", "TV", "Books"]

    var body: some View {
        SectionScreen(title: "Media") {
            NowPlayingCard()

            SectionGroup(title: "Apple Media Apps") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: 12)], spacing: 12) {
                    ForEach(AppleApps.all.filter { Self.mediaApps.contains($0.name) }) { app in
                        MediaAppCard(app: app)
                    }
                }
            }

            Text("Halo shows playback from the Music app. Other apps’ playback isn’t visible to Halo.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}

private struct MediaAppCard: View {
    let app: Shortcut
    @Environment(AppModel.self) private var model

    var body: some View {
        let installed = model.opener.isInstalled(app)
        Button {
            Task {
                if installed { await model.opener.open(app) } else if let id = app.appStoreID { await StoreProductPresenter.present(appStoreID: id) }
            }
        } label: {
            HStack(spacing: 12) {
                ShortcutIcon(shortcut: app, size: 44)
                VStack(alignment: .leading) {
                    Text(app.name).font(.headline)
                    Text(installed ? "Open" : "Get in App Store").font(.caption).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 22))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
    }
}
