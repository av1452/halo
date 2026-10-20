import Testing
@testable import Halo

struct AppSectionTests {
    @Test func everySectionHasATitleAndSymbol() {
        for section in AppSection.allCases {
            #expect(!section.title.isEmpty)
            #expect(!section.systemImage.isEmpty)
        }
    }

    /// iPhone fits five tab bar items; more than four tabs plus search
    /// collapses sections into a "More" tab.
    @Test func tabBarFitsOnIPhone() {
        #expect(AppSection.tabs.count <= 4)
        #expect(!AppSection.tabs.contains(.search))
    }
}
