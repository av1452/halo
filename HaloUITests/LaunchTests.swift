import XCTest

final class LaunchTests: XCTestCase {
    @MainActor
    func testLaunchShowsHome() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.navigationBars["Home"].waitForExistence(timeout: 10))
    }
}
