import Foundation

/// Persists one Codable value as versioned JSON. Unreadable, corrupt or
/// newer-version files load as nil so callers fall back to defaults
/// rather than crashing or misreading data.
struct JSONStore<Value: Codable>: Sendable {
    let url: URL
    let version: Int

    private struct Envelope: Codable {
        let version: Int
        let value: Value
    }

    private struct VersionProbe: Decodable {
        let version: Int
    }

    init(name: String, version: Int = 1, directory: URL = JSONStore.defaultDirectory) {
        self.url = directory.appendingPathComponent("\(name).json")
        self.version = version
    }

    static var defaultDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("Halo", isDirectory: true)
    }

    func load() -> Value? {
        guard let data = try? Data(contentsOf: url),
              let probe = try? JSONDecoder().decode(VersionProbe.self, from: data),
              probe.version <= version
        else { return nil }
        return try? JSONDecoder().decode(Envelope.self, from: data).value
    }

    func save(_ value: Value) {
        do {
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try JSONEncoder().encode(Envelope(version: version, value: value))
            try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        } catch {
            // Persistence is best-effort; the in-memory state stays correct.
        }
    }

    func remove() {
        try? FileManager.default.removeItem(at: url)
    }
}
