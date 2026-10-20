import Foundation
import Testing
@testable import Halo

struct JSONStoreTests {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)

    @Test func roundTripsValues() {
        let store = JSONStore<[String]>(name: "items", directory: directory)
        #expect(store.load() == nil)
        store.save(["a", "b"])
        #expect(store.load() == ["a", "b"])
    }

    @Test func ignoresCorruptFiles() throws {
        let store = JSONStore<[String]>(name: "corrupt", directory: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try Data("{not json".utf8).write(to: store.url)
        #expect(store.load() == nil)
    }

    @Test func ignoresDataFromANewerVersion() {
        JSONStore<[String]>(name: "future", version: 3, directory: directory).save(["x"])
        #expect(JSONStore<[String]>(name: "future", version: 2, directory: directory).load() == nil)
    }

    @MainActor @Test func settingsPersistAndFillMissingKeys() throws {
        let store = JSONStore<Settings>(name: "settings", directory: directory)
        let settings = SettingsStore(store: store)
        settings.value.accent = .pink
        #expect(SettingsStore(store: store).value.accent == .pink)

        // A file from an older version without newer keys still loads
        try Data(#"{"version":1,"value":{"displayName":"Sam"}}"#.utf8).write(to: store.url)
        let loaded = SettingsStore(store: store).value
        #expect(loaded.displayName == "Sam")
        #expect(loaded.wallpaper == .dusk)
    }
}
