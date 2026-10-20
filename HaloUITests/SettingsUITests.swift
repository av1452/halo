import XCTest

final class SettingsUITests: XCTestCase {
    @MainActor
    func testOpenSettingsChangeAccentAndClose() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData"]
        app.launch()

        app.buttons["Settings"].firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))

        let pink = app.buttons["Pink"]
        pink.tap()
        XCTAssertTrue(pink.isSelected)

        app.buttons["Done"].tap()
        XCTAssertTrue(app.navigationBars["Home"].waitForExistence(timeout: 5))
    }
}
