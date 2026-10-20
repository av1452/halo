import XCTest

final class MediaUITests: XCTestCase {
    @MainActor
    func testMusicAccessFlowAndMediaApps() throws {
        let app = XCUIApplication()
        app.resetAuthorizationStatus(for: .mediaLibrary)
        app.launchArguments = ["-haloResetData", "-haloSection", "media"]
        app.launch()

        let allow = app.buttons["Allow Access"]
        if allow.waitForExistence(timeout: 5) {
            allow.tap()
            let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
            let ok = springboard.alerts.buttons["Allow"]
            if ok.waitForExistence(timeout: 5) { ok.tap() }
        }
        // Nothing plays in the Simulator's (absent) Music app
        XCTAssertTrue(app.staticTexts["Nothing Playing"].waitForExistence(timeout: 8))
        // The Simulator has no Music app, so Halo offers it rather than a dead "Open" button
        XCTAssertTrue(app.buttons["Get Apple Music"].exists)
        XCTAssertTrue(app.buttons["TV, Get in App Store"].exists || app.buttons["TV, Open"].exists)
    }
}
