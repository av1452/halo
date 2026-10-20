import XCTest

final class HomeUITests: XCTestCase {
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "home", "-haloDemoHome"]
        app.launch()
        return app
    }

    private func allowSystemAlert() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow Full Access", "Allow", "OK"] {
            let button = springboard.alerts.buttons[label]
            if button.waitForExistence(timeout: 4) { button.tap(); return }
        }
    }

    @MainActor
    func testDashboardShowsDefaultWidgetsAndAsksBeforeWeather() throws {
        let app = launch()
        XCTAssertTrue(app.otherElements["Clock"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.otherElements["Weather"].exists)
        XCTAssertTrue(app.buttons["Set Location"].exists)
    }

    @MainActor
    func testCustomizeHomeHidesAWidget() throws {
        let app = launch()
        app.navigationBars.buttons["Customize Home"].tap()
        let sheet = app.navigationBars["Customize Home"]
        XCTAssertTrue(sheet.waitForExistence(timeout: 5))
        app.buttons["Remove Clock"].tap()
        app.buttons["Done"].tap()
        XCTAssertFalse(app.otherElements["Clock"].waitForExistence(timeout: 2))
    }

    @MainActor
    func testRemindersAccessAndAddingAReminder() throws {
        // Start from "not asked" so the real permission prompt appears
        let fresh = XCUIApplication()
        fresh.resetAuthorizationStatus(for: .reminders)
        let app = launch()
        let reminders = app.otherElements["Reminders"]
        for _ in 0..<4 where !reminders.buttons["Allow Access"].isHittable { app.swipeUp() }
        reminders.buttons["Allow Access"].tap()
        allowSystemAlert()

        let field = app.textFields["New Reminder"]
        XCTAssertTrue(field.waitForExistence(timeout: 8))
        field.tap()
        let title = "Halo test \(Int.random(in: 1000...9999))"
        field.typeText(title + "\n")
        // The reminder is saved to the real Reminders store and listed back
        XCTAssertTrue(app.buttons["Complete \(title)"].waitForExistence(timeout: 8))
        app.buttons["Complete \(title)"].tap()
        XCTAssertFalse(app.buttons["Complete \(title)"].waitForExistence(timeout: 3))
    }
}
