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
        XCTAssertTrue(app.otherElements["Clock"].waitForExistence(timeout: 5))
    }
}

final class SettingsDataUITests: XCTestCase {
    @MainActor
    func testResetHaloAsksFirst() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloOpenSettings"]
        app.launch()
        let reset = app.buttons["Reset Halo"]
        for _ in 0..<5 where !reset.isHittable { app.swipeUp() }
        reset.tap()
        XCTAssertTrue(app.buttons["Erase & Reset"].waitForExistence(timeout: 5))
        app.buttons["Erase & Reset"].tap()
        XCTAssertTrue(app.alerts["Halo was reset to its defaults."].waitForExistence(timeout: 5))
    }

    @MainActor
    func testSmartHomeSourceSwitchesToDemo() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloOpenSettings"]
        app.launch()
        let demo = app.buttons["Demo Home"]
        for _ in 0..<3 where !demo.isHittable { app.swipeUp() }
        demo.tap()
        XCTAssertTrue(app.buttons["Reset Demo Home"].waitForExistence(timeout: 3))
    }
}
