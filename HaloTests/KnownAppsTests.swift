import Foundation
import Testing
@testable import Halo

@MainActor
struct KnownAppsTests {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    var launcher: LauncherStore { LauncherStore(store: JSONStore(name: "launcher", directory: directory)) }

    @Test func everySchemeIsDeclaredAndWithinIOSLimit() throws {
        let declared = try #require(Bundle.main.object(forInfoDictionaryKey: "LSApplicationQueriesSchemes") as? [String])
        #expect(declared.count <= 50)
        #expect(Set(declared).count == declared.count)
        for app in KnownApps.all { #expect(declared.contains(app.scheme), "\(app.name) scheme not declared") }
        for apple in AppleApps.all {
            let scheme = String(apple.url.prefix { $0 != ":" })
            #expect(declared.contains(scheme), "\(apple.name) scheme not declared")
        }
    }

    @Test func catalogHasUniqueIDsAndSchemes() {
        #expect(Set(KnownApps.all.map { $0.id }).count == KnownApps.all.count)
        #expect(Set(KnownApps.all.map { $0.scheme }).count == KnownApps.all.count)
    }

    @Test func addsInstalledAppsOnce() {
        let store = launcher
        let result = store.syncInstalled { ["spotify", "whatsapp"].contains($0.id) }
        #expect(result.added == ["whatsapp", "spotify"])
        let added = store.shortcuts.filter { $0.autoAdded == true }
        #expect(Set(added.map { $0.name }) == ["Spotify", "WhatsApp"])
        #expect(added.allSatisfy { $0.appStoreID != nil })
        // Syncing again changes nothing
        #expect(store.syncInstalled { ["spotify", "whatsapp"].contains($0.id) } == .init())
    }

    @Test func removesUninstalledAutoAddedAppsButNotUserShortcuts() {
        let store = launcher
        store.syncInstalled { $0.id == "spotify" }
        var mine = KnownApps.all.first { $0.id == "netflix" }!.shortcut()
        mine.autoAdded = false   // the user added this one themselves
        store.add(mine)
        let result = store.syncInstalled { _ in false }
        #expect(result.removed == ["spotify"])
        #expect(store.shortcuts.contains { $0.name == "Netflix" })
    }

    @Test func doesNotReAddAppsTheUserRemoved() {
        let store = launcher
        store.syncInstalled { $0.id == "spotify" }
        let spotify = store.shortcuts.first { $0.knownAppID == "spotify" }!
        store.remove([spotify.id])
        #expect(store.syncInstalled { $0.id == "spotify" }.added.isEmpty)
        #expect(store.hiddenDetectedApps.map { $0.id } == ["spotify"])
        store.showHiddenDetectedApps()
        #expect(store.syncInstalled { $0.id == "spotify" }.added == ["spotify"])
    }

    @Test func olderSavedDataStillLoads() throws {
        let file = JSONStore<LauncherStore.State>(name: "old", directory: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let json = #"{"version":1,"value":{"shortcuts":[{"id":"6F1C1E40-0000-4000-8000-000000000001","name":"Blog","url":"https://blog.example/","symbol":"globe","colorHex":0,"isFavorite":false,"isAppleApp":false}],"recents":[]}}"#
        try Data(json.utf8).write(to: file.url)
        let state = try #require(file.load())
        #expect(state.shortcuts.first?.knownAppID == nil)
        #expect(state.dismissedKnownApps.isEmpty)
    }
}
