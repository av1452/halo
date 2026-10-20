import XCTest

final class SmartHomeUITests: XCTestCase {
    private func launch(_ extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "smartHome"] + extra
        app.launch()
        return app
    }

    /// Answers the system HomeKit permission alert if it appears.
    private func respondToHomeAlert(allow: Bool) {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let button = springboard.alerts.buttons[allow ? "Allow" : "Don’t Allow"]
        if button.waitForExistence(timeout: 8) { button.tap() }
    }

    @MainActor
    func testAllowingHomeKitWithNoHomeExplainsWhatToDo() throws {
        let app = launch()
        respondToHomeAlert(allow: true)
        // The simulator has no home set up in the Home app
        XCTAssertTrue(app.staticTexts["No Home Set Up"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Try the Demo Home"].exists)
    }

    @MainActor
    func testDemoHomeIsLabelledAndControllable() throws {
        let app = launch()
        respondToHomeAlert(allow: false)
        app.buttons["Try the Demo Home"].tap()

        XCTAssertTrue(app.staticTexts["These devices are simulated. Nothing in your home is controlled."].waitForExistence(timeout: 5))

        let lamp = app.buttons["Floor Lamp"]
        XCTAssertTrue(lamp.waitForExistence(timeout: 5))
        XCTAssertEqual(lamp.value as? String, "Off")
        lamp.tap()
        XCTAssertEqual(lamp.value as? String, "45%")

        app.buttons["All Lights Off"].tap()
        XCTAssertEqual(lamp.value as? String, "Off")
        XCTAssertTrue(app.staticTexts["0 lights on"].exists)
    }

    @MainActor
    func testThermostatControlsAdjustTheTarget() throws {
        let app = launch()
        respondToHomeAlert(allow: false)
        app.buttons["Try the Demo Home"].tap()

        let thermostat = app.buttons["Thermostat"]
        // Tiles below the fold are created lazily, so scroll like a user would
        for _ in 0..<6 where !thermostat.isHittable { app.swipeUp() }
        XCTAssertTrue(thermostat.isHittable)
        thermostat.tap()  // thermostats open their controls
        let increment = app.steppers.buttons.matching(identifier: "Increment").firstMatch
        XCTAssertTrue(increment.waitForExistence(timeout: 5))
        increment.tap()
        let stepper = app.steppers.firstMatch
        XCTAssertEqual(stepper.value as? String, "21.5")
        XCTAssertTrue(stepper.label.contains("21.5°C"))
        // The tile behind the sheet shows the half degree too, not a rounded 22°C
        XCTAssertTrue((thermostat.value as? String ?? "").contains("Heat to 21.5°C"))
    }
}
