import Foundation
import Testing
@testable import Halo

struct ShortcutURLTests {
    @Test(arguments: [
        ("github.com", "https://github.com"),
        ("example.com:8080/x", "https://example.com:8080/x"),
        ("mailto:hi@example.com", "mailto:hi@example.com"),
        ("tel:5551234", "tel:5551234"),
        ("shortcuts://", "shortcuts://"),
    ])
    func acceptsUsableAddresses(input: String, expected: String) {
        #expect(ShortcutURL.normalize(input)?.absoluteString == expected)
    }

    @Test(arguments: ["javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "not a url", "word", "", "tel:"])
    func rejectsUnsafeOrMalformedInput(input: String) {
        #expect(ShortcutURL.normalize(input) == nil)
    }
}

@MainActor
struct LauncherStoreTests {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    var store: JSONStore<LauncherStore.State> { JSONStore(name: "launcher", directory: directory) }

    @Test func startsWithAppleAppsAndPersistsChanges() {
        let launcher = LauncherStore(store: store)
        let shortcuts = launcher.shortcuts
        #expect(shortcuts.count == AppleApps.all.count)
        #expect(shortcuts.allSatisfy{ $0.isAppleApp })
        launcher.add(Shortcut(name: "Blog", url: "https://blog.example/", symbol: "globe", colorHex: 0))
        #expect(LauncherStore(store: store).shortcuts.last?.name == "Blog")
    }

    @Test func dropsSavedShortcutsWithUnsafeURLs() throws {
        let bad = LauncherStore.State(shortcuts: [Shortcut(name: "Evil", url: "javascript:alert(1)", symbol: "x", colorHex: 0)])
        store.save(bad)
        #expect(LauncherStore(store: store).shortcuts.isEmpty)
    }

    @Test func filtersByQueryFavoritesAndFolder() {
        let launcher = LauncherStore(store: store)
        let podcasts = launcher.filtered(query: "pod", folder: nil, favoritesOnly: false).map(\.name)
        #expect(podcasts == ["Podcasts"])
        #expect(launcher.filtered(query: "", folder: nil, favoritesOnly: true).allSatisfy{ $0.isFavorite })
        #expect(launcher.filtered(query: "", folder: "Entertainment", favoritesOnly: false).allSatisfy { $0.folder == "Entertainment" })
    }

    @Test func recentsMoveToFrontAndFollowRemovals() {
        let launcher = LauncherStore(store: store)
        let (a, b) = (launcher.shortcuts[0].id, launcher.shortcuts[1].id)
        launcher.recordOpen(a)
        launcher.recordOpen(b)
        launcher.recordOpen(a)
        #expect(launcher.recentShortcuts.map{ $0.id } == [a, b])
        launcher.remove([a])
        #expect(launcher.recentShortcuts.map{ $0.id } == [b])
    }

    @Test func restoresDeletedAppleApps() {
        let launcher = LauncherStore(store: store)
        launcher.remove(Set(launcher.shortcuts.prefix(3).map(\.id)))
        launcher.restoreAppleApps()
        #expect(launcher.shortcuts.count == AppleApps.all.count)
    }
}

struct AppStoreClientTests {
    static let fixture = Data(#"{"resultCount":2,"results":[{"trackId":42,"trackName":"Example","sellerName":"Example Inc.","primaryGenreName":"Utilities","formattedPrice":"Free","artworkUrl512":"https://is1-ssl.mzstatic.com/a.png","screenshotUrls":["https://is1-ssl.mzstatic.com/s.png","http://insecure.example/s.png"],"averageUserRating":4.6},{"trackName":"No ID"}]}"#.utf8)

    @Test func parsesResultsAndKeepsOnlyHTTPSMedia() throws {
        let apps = try AppStoreClient.parse(Self.fixture)
        #expect(apps.map{ $0.id } == [42])
        #expect(apps[0].screenshotURLs.map{ $0.absoluteString } == ["https://is1-ssl.mzstatic.com/s.png"])
        #expect(apps[0].rating == 4.6)
    }

    @Test func mapsErrorsAndCaches() async throws {
        let counter = Counter()
        let client = AppStoreClient(country: "gb") { url in
            await counter.increment()
            #expect(url.absoluteString.contains("country=gb"))
            return (Self.fixture, HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)!)
        }
        _ = try await client.search("notes")
        _ = try await client.search("notes")
        #expect(await counter.value == 1)

        let limited = AppStoreClient { url in (Data(), HTTPURLResponse(url: url, statusCode: 429, httpVersion: nil, headerFields: nil)!) }
        await #expect(throws: AppStoreError.self) { try await limited.lookup([1]) }
        let offline = AppStoreClient { _ in throw URLError(.notConnectedToInternet) }
        do {
            _ = try await offline.search("x")
            Issue.record("expected an error")
        } catch {
            #expect(error.localizedDescription.contains("Couldn’t reach"))
        }
    }
}

actor Counter {
    var value = 0
    func increment() { value += 1 }
}
