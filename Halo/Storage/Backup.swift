import SwiftUI
import UniformTypeIdentifiers

/// A portable copy of Halo's data. Every section is optional and decoded
/// independently, so a corrupt section is skipped instead of failing the import.
struct HaloBackup: Codable {
    static let formatName = "halo-ios-backup"
    static let currentVersion = 1

    var format = HaloBackup.formatName
    var version = HaloBackup.currentVersion
    var exportedAt = Date.now
    var appVersion = Bundle.main.appVersion
    var settings: Settings?
    var launcher: LauncherStore.State?
    var dashboard: [DashboardItem]?
    var discover: DiscoverStore.State?
    var notes: String?
    var pinnedDevices: [String]?
    var weatherPlace: WeatherPlace?

    init() {}

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        format = try c.decode(String.self, forKey: .format)
        version = try c.decode(Int.self, forKey: .version)
        exportedAt = (try? c.decode(Date.self, forKey: .exportedAt)) ?? .distantPast
        appVersion = (try? c.decode(String.self, forKey: .appVersion)) ?? "unknown"
        settings = try? c.decode(Settings.self, forKey: .settings)
        launcher = try? c.decode(LauncherStore.State.self, forKey: .launcher)
        dashboard = try? c.decode([DashboardItem].self, forKey: .dashboard)
        discover = try? c.decode(DiscoverStore.State.self, forKey: .discover)
        notes = try? c.decode(String.self, forKey: .notes)
        pinnedDevices = try? c.decode([String].self, forKey: .pinnedDevices)
        weatherPlace = try? c.decode(WeatherPlace.self, forKey: .weatherPlace)
    }

    /// Names of the sections present, for confirmation and reports.
    var sections: [String] {
        [settings.map { _ in "Settings" }, launcher.map { _ in "Apps" }, dashboard.map { _ in "Home layout" },
         discover.map { _ in "Discover" }, notes.map { _ in "Notes" }, pinnedDevices.map { _ in "Pinned devices" },
         weatherPlace.map { _ in "Weather location" }].compactMap { $0 }
    }

    enum ImportError: LocalizedError {
        case unreadable, notABackup, newerVersion
        var errorDescription: String? {
            switch self {
            case .unreadable: "This file isn’t valid JSON."
            case .notABackup: "This file isn’t a Halo backup."
            case .newerVersion: "This backup was made by a newer version of Halo."
            }
        }
    }

    static func decode(_ data: Data) throws -> HaloBackup {
        guard (try? JSONSerialization.jsonObject(with: data)) != nil else { throw ImportError.unreadable }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let backup = try? decoder.decode(HaloBackup.self, from: data), backup.format == formatName else { throw ImportError.notABackup }
        guard backup.version <= currentVersion else { throw ImportError.newerVersion }
        return backup
    }

    func encoded() throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(self)
    }
}

/// Lets SwiftUI's file exporter save a backup.
struct BackupDocument: FileDocument {
    static let readableContentTypes: [UTType] = [.json]
    let data: Data

    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws {
        data = configuration.file.regularFileContents ?? Data()
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}
