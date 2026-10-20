import XCTest

final class LaunchTests: XCTestCase {
    @MainActor
    func testLaunchShowsHome() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData"]
        app.launch()
        // Home's title is a greeting, so check for the dashboard itself
        XCTAssertTrue(app.otherElements["Clock"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Home"].isSelected)
    }
}
