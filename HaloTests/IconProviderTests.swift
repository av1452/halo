import Foundation
import Testing
import UIKit
@testable import Halo

@MainActor
struct IconProviderTests {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)

    nonisolated static func png(size: CGFloat) -> Data {
        // 1x so the pixel size matches `size` regardless of the Simulator's screen scale
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        return UIGraphicsImageRenderer(size: CGSize(width: size, height: size), format: format).pngData { ctx in
            UIColor.red.setFill()
            ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
        }
    }

    nonisolated static let lookupJSON = Data(#"{"results":[{"trackId":915056765,"trackName":"Apple Maps","artworkUrl512":"https://icons.example/maps.png"}]}"#.utf8)

    @Test func keysAppsByStoreIDAndSitesByHost() {
        #expect(IconProvider.key(for: Shortcut(name: "Maps", url: "maps://", symbol: "", colorHex: 0, appStoreID: 915056765)) == "app-915056765")
        #expect(IconProvider.key(for: Shortcut(name: "Blog", url: "https://Blog.Example/post", symbol: "", colorHex: 0)) == "web-blog.example")
        #expect(IconProvider.key(for: Shortcut(name: "Call", url: "tel:123", symbol: "", colorHex: 0)) == nil)
    }

    @Test func loadsAppStoreArtworkAndCachesIt() async {
        let requests = Captured2()
        let fetch: IconProvider.Fetch = { url in
            await requests.add(url)
            let data = url.host() == "itunes.apple.com" ? Self.lookupJSON : Self.png(size: 512)
            return (data, HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)!)
        }
        let maps = Shortcut(name: "Maps", url: "maps://", symbol: "map", colorHex: 0, appStoreID: 915056765)
        let provider = IconProvider(appStore: AppStoreClient(country: "us", fetch: fetch), directory: directory, fetch: fetch)
        await provider.load([maps])
        #expect(provider.image(for: maps) != nil)
        #expect(await requests.urls.map { $0.host() ?? "" } == ["itunes.apple.com", "icons.example"])

        // A new provider reads the disk cache without touching the network
        let offline = IconProvider(appStore: AppStoreClient(fetch: { _ in throw URLError(.notConnectedToInternet) }), directory: directory,
                                   fetch: { _ in throw URLError(.notConnectedToInternet) })
        await offline.load([maps])
        #expect(offline.image(for: maps) != nil)
    }

    @Test func usesTheWebsitesTouchIconAndIgnoresTinyImages() async {
        let fetch: IconProvider.Fetch = { url in
            let size: CGFloat = url.lastPathComponent == "apple-touch-icon.png" ? 16 : 180   // first is too small
            return (Self.png(size: size), HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)!)
        }
        let blog = Shortcut(name: "Blog", url: "https://blog.example/", symbol: "globe", colorHex: 0)
        let provider = IconProvider(appStore: AppStoreClient(fetch: fetch), directory: directory, fetch: fetch)
        await provider.load([blog])
        #expect(provider.image(for: blog)?.size.width == 180)
    }

    @Test func parsesAppStoreLinks() {
        #expect(ShortcutURL.appStoreID(in: URL(string: "https://apps.apple.com/us/app/things-3/id904237743")!) == 904237743)
        #expect(ShortcutURL.appStoreID(in: URL(string: "https://apps.apple.com.evil.example/app/id1")!) == nil)
        #expect(ShortcutURL.appStoreID(in: URL(string: "https://example.com/id5")!) == nil)
    }
}

actor Captured2 {
    var urls: [URL] = []
    func add(_ url: URL) { urls.append(url) }
}
