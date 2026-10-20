import Foundation
import Testing
@testable import Halo

@MainActor
struct BackupTests {
    func makeModel() -> AppModel {
        AppModel(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
    }

    @Test func roundTripsThroughExportAndImport() async throws {
        let source = makeModel()
        source.settings.value.accent = .pink
        source.settings.value.displayName = "Sam"
        source.launcher.add(Shortcut(name: "Blog", url: "https://blog.example/", symbol: "globe", colorHex: 0))
        source.dashboard.remove(.clock)
        source.notes.text = "Buy milk"
        let data = try source.makeBackup().encoded()

        let target = makeModel()
        let applied = await target.apply(try HaloBackup.decode(data))
        #expect(applied.contains("Settings") && applied.contains("Apps") && applied.contains("Notes"))
        #expect(target.settings.value.accent == .pink)
        #expect(target.launcher.shortcuts.contains { $0.name == "Blog" })
        #expect(!target.dashboard.items.contains { $0.widget == .clock })
        #expect(target.notes.text == "Buy milk")
    }

    @Test func rejectsFilesThatAreNotHaloBackups() {
        #expect(throws: HaloBackup.ImportError.unreadable) { try HaloBackup.decode(Data("nope".utf8)) }
        #expect(throws: HaloBackup.ImportError.notABackup) { try HaloBackup.decode(Data(#"{"format":"other","version":1}"#.utf8)) }
        #expect(throws: HaloBackup.ImportError.newerVersion) { try HaloBackup.decode(Data(#"{"format":"halo-ios-backup","version":99}"#.utf8)) }
    }

    @Test func skipsCorruptSectionsAndUnsafeShortcuts() async throws {
        let json = #"""
        {"format":"halo-ios-backup","version":1,
         "settings":"garbage",
         "notes":"Kept",
         "launcher":{"shortcuts":[{"id":"6F1C1E40-0000-4000-8000-000000000001","name":"Evil","url":"javascript:alert(1)","symbol":"x","colorHex":0,"isFavorite":false,"isAppleApp":false}],"recents":[]}}
        """#
        let backup = try HaloBackup.decode(Data(json.utf8))
        #expect(backup.settings == nil)
        #expect(backup.sections == ["Apps", "Notes"])
        let model = makeModel()
        model.settings.value.accent = .green
        await model.apply(backup)
        #expect(model.settings.value.accent == .green)
        #expect(model.notes.text == "Kept")
        #expect(!model.launcher.shortcuts.contains { $0.name == "Evil" })
    }

    @Test func resetRestoresDefaults() {
        let model = makeModel()
        model.settings.value.accent = .pink
        model.launcher.remove(Set(model.launcher.shortcuts.map { $0.id }))
        model.resetAll()
        #expect(model.settings.value == Settings())
        #expect(model.launcher.shortcuts.count == AppleApps.all.count)
    }
}
