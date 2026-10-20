import Testing
@testable import Halo

@MainActor
struct SearchTests {
    let index = SearchIndex.build(shortcuts: AppleApps.defaults(), home: DemoHomeProvider.initialHome, widgets: DashboardStore.defaultLayout)

    @Test func indexesEveryKindOfContent() {
        let groups = Set(index.map { $0.group })
        #expect(groups == Set(SearchItem.Group.allCases))
    }

    @Test func ranksTitleMatchesAboveKeywordMatches() {
        let exact = SearchItem(id: "1", group: .apps, title: "Notes", systemImage: "x", action: .openSettings)
        let prefix = SearchItem(id: "2", group: .apps, title: "Notes Pro", systemImage: "x", action: .openSettings)
        let keyword = SearchItem(id: "3", group: .apps, title: "Day One", keywords: "journal notes", systemImage: "x", action: .openSettings)
        #expect(SearchIndex.score(exact, "notes") > SearchIndex.score(prefix, "notes"))
        #expect(SearchIndex.score(prefix, "notes") > SearchIndex.score(keyword, "notes"))
        #expect(SearchIndex.score(exact, "  ") == 0)
    }

    @Test func findsDevicesScenesAndSettings() {
        let lamp = SearchIndex.search(index, "lamp")
        #expect(lamp.map { $0.group } == [.smartHome])
        #expect(Set(lamp[0].items.map { $0.title }) == ["Floor Lamp", "Bedside Lamp"])
        let movie = SearchIndex.search(index, "movie").flatMap { $0.items }
        #expect(movie.contains { $0.action == .runScene("movie-time", name: "Movie Time") })
        #expect(SearchIndex.search(index, "dark").contains { $0.group == .settings })
    }
}
