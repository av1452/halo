import Foundation
import Testing
@testable import Halo

@MainActor
struct DashboardTests {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)

    @Test func wideWidgetsTakeAWholeRow() {
        let items: [DashboardItem] = [.init(widget: .clock, isWide: false), .init(widget: .weather, isWide: false), .init(widget: .calendar, isWide: false),
                                      .init(widget: .smartHome, isWide: true), .init(widget: .notes, isWide: false)]
        let rows = DashboardStore.rows(for: items, columns: 2).map { $0.map { $0.widget } }
        #expect(rows == [[.clock, .weather], [.calendar], [.smartHome], [.notes]])
        #expect(DashboardStore.rows(for: items, columns: 1).count == 5)
    }

    @Test func addsRemovesAndPersistsWithoutDuplicates() {
        let store = JSONStore<[DashboardItem]>(name: "dashboard", directory: directory)
        let dashboard = DashboardStore(store: store)
        dashboard.remove(.clock)
        dashboard.add(.notes)
        dashboard.add(.notes)
        let widgets = DashboardStore(store: store).items.map { $0.widget }
        #expect(!widgets.contains(.clock))
        #expect(widgets.filter { $0 == .notes }.count == 1)
    }

    @Test func dropsDuplicateWidgetsFromSavedLayouts() {
        let store = JSONStore<[DashboardItem]>(name: "dupes", directory: directory)
        store.save([.init(widget: .notes, isWide: false), .init(widget: .notes, isWide: true)])
        let items = DashboardStore(store: store).items
        #expect(items == [.init(widget: .notes, isWide: false)])
    }
}

struct RemindersSortTests {
    @Test func datedRemindersComeFirstSoonestFirst() {
        let now = Date(timeIntervalSince1970: 1_000_000)
        let sorted = CalendarController.sortReminders([
            .init(id: "a", title: "Undated B", due: nil),
            .init(id: "b", title: "Later", due: now.addingTimeInterval(86_400)),
            .init(id: "c", title: "Undated A", due: nil),
            .init(id: "d", title: "Sooner", due: now),
        ])
        #expect(sorted.map { $0.title } == ["Sooner", "Later", "Undated A", "Undated B"])
    }
}

struct WeatherTests {
    static let place = WeatherPlace(name: "Lisbon", latitude: 38.7167, longitude: -9.1333)
    static func respond(_ body: String, status: Int = 200) -> WeatherController.Fetch {
        { url in (Data(body.utf8), HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: nil)!) }
    }

    @Test func parsesTheForecastAndRoundsCoordinates() async throws {
        let captured = Captured()
        let report = try await WeatherController.forecast(for: Self.place, fetch: { url in
            await captured.set(url)
            return try await Self.respond(#"{"current":{"temperature_2m":18.4,"weather_code":2},"daily":{"temperature_2m_max":[21],"temperature_2m_min":[12]}}"#)(url)
        }, now: Date(timeIntervalSince1970: 0))
        #expect(report == WeatherReport(temperature: 18.4, high: 21, low: 12, code: 2, fetchedAt: Date(timeIntervalSince1970: 0)))
        let url = await captured.url
        #expect(url?.absoluteString.contains("latitude=38.72&longitude=-9.13") == true)
    }

    @Test func reportsNetworkStatusAndFormatErrors() async {
        await #expect(throws: WeatherError.self) { try await WeatherController.forecast(for: Self.place, fetch: { _ in throw URLError(.notConnectedToInternet) }) }
        await #expect(throws: WeatherError.self) { try await WeatherController.forecast(for: Self.place, fetch: Self.respond("{}", status: 429)) }
        await #expect(throws: WeatherError.self) { try await WeatherController.forecast(for: Self.place, fetch: Self.respond(#"{"nope":1}"#)) }
    }

    @Test func mapsWeatherCodes() {
        let condition = { (code: Int) in WeatherReport(temperature: 0, high: 0, low: 0, code: code, fetchedAt: .now).condition.label }
        #expect(condition(0) == "Clear")
        #expect(condition(63) == "Rain")
        #expect(condition(95) == "Thunderstorm")
    }

    @MainActor @Test func showsNothingUntilAPlaceIsChosen() async {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let weather = WeatherController(store: JSONStore(name: "weather", directory: directory), fetch: { _ in
            Issue.record("Weather must not be fetched without a place")
            throw URLError(.badURL)
        })
        await weather.refreshIfStale()
        #expect(weather.report == nil)
    }
}

actor Captured {
    var url: URL?
    func set(_ url: URL) { self.url = url }
}
