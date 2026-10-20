import Foundation

/// An app as described by Apple's iTunes Search API.
struct StoreApp: Identifiable, Equatable, Codable, Sendable {
    let id: Int
    let name: String
    let developer: String
    let genre: String
    let price: String
    let iconURL: URL?
    let screenshotURLs: [URL]
    let rating: Double?
    let ratingCount: Int?
    let summary: String
}

enum AppStoreError: LocalizedError {
    case network, rateLimited, badResponse(Int), unexpected

    var errorDescription: String? {
        switch self {
        case .network: "Couldn’t reach the App Store. Check your connection."
        case .rateLimited: "The App Store is limiting requests. Try again in a minute."
        case .badResponse(let code): "The App Store returned an error (\(code))."
        case .unexpected: "The App Store sent an unexpected response."
        }
    }
}

/// Apple's public iTunes Search API: documented, no key. Apple asks for about
/// 20 requests a minute, so responses are cached and searches run on submit.
actor AppStoreClient {
    typealias Fetch = @Sendable (URL) async throws -> (Data, URLResponse)

    private let fetch: Fetch
    private let country: String
    private var cache: [URL: [StoreApp]] = [:]

    init(country: String = Locale.current.region?.identifier.lowercased() ?? "us",
         fetch: @escaping Fetch = { try await URLSession.shared.data(from: $0) }) {
        self.country = country
        self.fetch = fetch
    }

    func search(_ term: String) async throws -> [StoreApp] {
        var components = URLComponents(string: "https://itunes.apple.com/search")!
        components.queryItems = [
            URLQueryItem(name: "term", value: term.trimmingCharacters(in: .whitespaces)),
            URLQueryItem(name: "entity", value: "software"),
            URLQueryItem(name: "limit", value: "15"),
            URLQueryItem(name: "country", value: country),
        ]
        return try await request(components.url!)
    }

    func lookup(_ ids: [Int]) async throws -> [StoreApp] {
        guard !ids.isEmpty else { return [] }
        let url = URL(string: "https://itunes.apple.com/lookup?country=\(country)&id=\(ids.map(String.init).joined(separator: ","))")!
        return try await request(url)
    }

    private func request(_ url: URL) async throws -> [StoreApp] {
        if let hit = cache[url] { return hit }
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await fetch(url)
        } catch {
            throw AppStoreError.network
        }
        if let http = response as? HTTPURLResponse, http.statusCode != 200 {
            throw [403, 429].contains(http.statusCode) ? AppStoreError.rateLimited : AppStoreError.badResponse(http.statusCode)
        }
        let apps = try Self.parse(data)
        cache[url] = apps
        return apps
    }

    static func parse(_ data: Data) throws -> [StoreApp] {
        struct Response: Decodable { let results: [Result] }
        struct Result: Decodable {
            let trackId: Int?
            let trackName: String?
            let sellerName: String?
            let artistName: String?
            let primaryGenreName: String?
            let formattedPrice: String?
            let artworkUrl512: String?
            let artworkUrl100: String?
            let screenshotUrls: [String]?
            let ipadScreenshotUrls: [String]?
            let averageUserRating: Double?
            let userRatingCount: Int?
            let description: String?
        }
        guard let response = try? JSONDecoder().decode(Response.self, from: data) else { throw AppStoreError.unexpected }
        let https = { (s: String) -> URL? in s.hasPrefix("https://") ? URL(string: s) : nil }
        return response.results.compactMap { r in
            guard let id = r.trackId, let name = r.trackName else { return nil }
            return StoreApp(
                id: id,
                name: name,
                developer: r.sellerName ?? r.artistName ?? "",
                genre: r.primaryGenreName ?? "",
                price: r.formattedPrice ?? "",
                iconURL: (r.artworkUrl512 ?? r.artworkUrl100).flatMap(https),
                screenshotURLs: Array(((r.screenshotUrls ?? []) + (r.ipadScreenshotUrls ?? [])).compactMap(https).prefix(6)),
                rating: r.averageUserRating,
                ratingCount: r.userRatingCount,
                summary: r.description ?? ""
            )
        }
    }
}
