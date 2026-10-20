import CoreLocation
import Foundation
import MapKit

struct WeatherPlace: Codable, Equatable, Sendable {
    var name: String
    var latitude: Double
    var longitude: Double
}

struct WeatherReport: Codable, Equatable, Sendable {
    var temperature: Double
    var high: Double
    var low: Double
    var code: Int
    var fetchedAt: Date

    /// WMO weather codes → label and SF Symbol.
    var condition: (label: String, symbol: String) {
        switch code {
        case 0: ("Clear", "sun.max.fill")
        case 1...2: ("Partly Cloudy", "cloud.sun.fill")
        case 3: ("Overcast", "cloud.fill")
        case 4...48: ("Fog", "cloud.fog.fill")
        case 49...57: ("Drizzle", "cloud.drizzle.fill")
        case 58...67, 80...82: ("Rain", "cloud.rain.fill")
        case 68...77, 85...86: ("Snow", "cloud.snow.fill")
        default: ("Thunderstorm", "cloud.bolt.rain.fill")
        }
    }
}

/// Weather for a place the user chooses. Places come from Apple's CoreLocation
/// (search or current location); the forecast comes from Open-Meteo (free, no
/// key) until WeatherKit is available with the Apple Developer Program.
@MainActor @Observable
final class WeatherController: NSObject {
    typealias Fetch = @Sendable (URL) async throws -> (Data, URLResponse)

    struct Saved: Codable, Equatable {
        var place: WeatherPlace?
        var report: WeatherReport?
    }

    private(set) var saved: Saved { didSet { if saved != oldValue { store.save(saved) } } }
    private(set) var loading = false
    private(set) var error: String?
    private(set) var locating = false

    @ObservationIgnored private let store: JSONStore<Saved>
    @ObservationIgnored private let fetch: Fetch
    @ObservationIgnored private let locationManager = CLLocationManager()
    @ObservationIgnored private var locationContinuation: CheckedContinuation<CLLocation?, Never>?

    static let maxAge: TimeInterval = 30 * 60

    init(store: JSONStore<Saved>, fetch: @escaping Fetch = { try await URLSession.shared.data(from: $0) }) {
        self.store = store
        self.fetch = fetch
        saved = store.load() ?? Saved()
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    var place: WeatherPlace? { saved.place }
    var report: WeatherReport? { saved.report }

    func refreshIfStale(now: Date = .now) async {
        guard place != nil, report.map({ now.timeIntervalSince($0.fetchedAt) > Self.maxAge }) ?? true else { return }
        await refresh()
    }

    func refresh() async {
        guard let place else { return }
        loading = true
        defer { loading = false }
        do {
            saved.report = try await Self.forecast(for: place, fetch: fetch)
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    func setPlace(_ place: WeatherPlace?) async {
        saved = Saved(place: place, report: nil)
        await refresh()
    }

    /// Apple geocoding (MapKit) for a typed place name.
    func search(_ query: String) async -> [WeatherPlace] {
        guard let request = MKGeocodingRequest(addressString: query) else { return [] }
        return await withCheckedContinuation { continuation in
            // Map to Sendable values in the handler; MapKit's types aren't Sendable
            request.getMapItems { items, _ in
                continuation.resume(returning: (items ?? []).map { item in
                    WeatherPlace(
                        name: item.addressRepresentations?.cityWithContext ?? item.name ?? query,
                        latitude: item.location.coordinate.latitude,
                        longitude: item.location.coordinate.longitude
                    )
                })
            }
        }
    }

    private func cityName(at location: CLLocation) async -> String? {
        guard let request = MKReverseGeocodingRequest(location: location) else { return nil }
        return await withCheckedContinuation { continuation in
            request.getMapItems { items, _ in
                continuation.resume(returning: items?.first?.addressRepresentations?.cityName)
            }
        }
    }

    /// Asks for location once; coordinates are rounded to ~1 km before use or storage.
    func useCurrentLocation() async {
        locating = true
        defer { locating = false }
        if locationManager.authorizationStatus == .notDetermined { locationManager.requestWhenInUseAuthorization() }
        let location = await withCheckedContinuation { continuation in
            locationContinuation = continuation
            locationManager.requestLocation()
        }
        guard let location else {
            error = "Couldn’t get your location. Check Location Services for Halo, or search for a city."
            return
        }
        let round = { (v: Double) in (v * 100).rounded() / 100 }
        let name = await cityName(at: location) ?? "Current Location"
        await setPlace(WeatherPlace(name: name, latitude: round(location.coordinate.latitude), longitude: round(location.coordinate.longitude)))
    }

    nonisolated static func forecast(for place: WeatherPlace, fetch: Fetch, now: Date = .now) async throws -> WeatherReport {
        var components = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: String(format: "%.2f", place.latitude)),
            URLQueryItem(name: "longitude", value: String(format: "%.2f", place.longitude)),
            URLQueryItem(name: "current", value: "temperature_2m,weather_code"),
            URLQueryItem(name: "daily", value: "temperature_2m_max,temperature_2m_min"),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "forecast_days", value: "1"),
        ]
        struct Response: Decodable {
            struct Current: Decodable { let temperature_2m: Double; let weather_code: Int }
            struct Daily: Decodable { let temperature_2m_max: [Double]; let temperature_2m_min: [Double] }
            let current: Current
            let daily: Daily
        }
        let data: Data
        let response: URLResponse
        do { (data, response) = try await fetch(components.url!) } catch { throw WeatherError.network }
        if let http = response as? HTTPURLResponse, http.statusCode != 200 { throw WeatherError.status(http.statusCode) }
        guard let decoded = try? JSONDecoder().decode(Response.self, from: data),
              let high = decoded.daily.temperature_2m_max.first, let low = decoded.daily.temperature_2m_min.first
        else { throw WeatherError.unexpected }
        return WeatherReport(temperature: decoded.current.temperature_2m, high: high, low: low, code: decoded.current.weather_code, fetchedAt: now)
    }
}

enum WeatherError: LocalizedError {
    case network, status(Int), unexpected
    var errorDescription: String? {
        switch self {
        case .network: "Couldn’t reach the weather service. Check your connection."
        case .status(let code): "The weather service returned an error (\(code))."
        case .unexpected: "The weather service sent data Halo didn’t understand."
        }
    }
}

extension WeatherController: @preconcurrency CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        locationContinuation?.resume(returning: locations.last)
        locationContinuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationContinuation?.resume(returning: nil)
        locationContinuation = nil
    }
}
