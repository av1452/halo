import XCTest

final class AppsUITests: XCTestCase {
    private func launch(_ extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "apps"] + extra
        app.launch()
        return app
    }

    @MainActor
    func testAddingAShortcutValidatesTheAddress() throws {
        let app = launch()
        app.navigationBars.buttons["Add Shortcut"].tap()
        let name = app.textFields["shortcut-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 5))
        name.tap()
        name.typeText("Field Notes")
        let address = app.textFields["shortcut-address"]
        address.tap()
        address.typeText("javascript:alert(1)")
        app.buttons["Add"].tap()
        XCTAssertTrue(app.staticTexts["Enter a web address like example.com, or an app link like spotify:."].waitForExistence(timeout: 3))

        address.press(forDuration: 1.2)
        if app.menuItems["Select All"].waitForExistence(timeout: 2) { app.menuItems["Select All"].tap() }
        address.typeText(XCUIKeyboardKey.delete.rawValue)
        address.typeText("fieldnotes.example")
        app.buttons["Add"].tap()

        let tile = app.buttons["Field Notes"]
        for _ in 0..<6 where !tile.isHittable { app.swipeUp() }
        XCTAssertTrue(tile.exists)
    }

    @MainActor
    func testAnAppThatIsNotInstalledOffersTheAppStore() throws {
        let app = launch()
        // The Simulator doesn't include the Music app
        let music = app.buttons["Music"]
        XCTAssertTrue(music.waitForExistence(timeout: 5))
        XCTAssertTrue((music.value as? String ?? "").contains("Not installed"))
        music.tap()
        XCTAssertTrue(app.alerts["Couldn’t Open Music"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.alerts.buttons["View in App Store"].exists)
        app.alerts.buttons["OK"].tap()
    }

    @MainActor
    func testOpeningAnInstalledAppleAppLaunchesIt() throws {
        let app = launch()
        let maps = app.buttons["Maps"]
        XCTAssertTrue(maps.waitForExistence(timeout: 5))
        maps.tap()
        // A cold first launch of Maps on a fresh CI Simulator can take well over 10 s
        XCTAssertTrue(XCUIApplication(bundleIdentifier: "com.apple.Maps").wait(for: .runningForeground, timeout: 45))
    }

    @MainActor
    func testDiscoverShowsPicksAndOpensDetails() throws {
        let app = launch(["-haloDiscover"])
        let pick = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Things 3'")).firstMatch
        XCTAssertTrue(pick.waitForExistence(timeout: 5))
        pick.tap()
        XCTAssertTrue(app.buttons["View in App Store"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Add to Apps"].exists)
    }
}

final class ArrangeUITests: XCTestCase {
    @MainActor
    func testArrangeRemovesAShortcut() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "apps"]
        app.launch()
        app.buttons["Manage"].tap()
        app.buttons["Arrange"].tap()
        let remove = app.buttons["Remove Podcasts"]
        XCTAssertTrue(remove.waitForExistence(timeout: 5))
        remove.tap()
        app.buttons["Done"].tap()
        XCTAssertFalse(app.buttons["Podcasts"].waitForExistence(timeout: 2))
    }
}

final class AppStoreFallbackUITests: XCTestCase {
    /// StoreKit can't load product pages in the Simulator, so Halo opens the App Store link instead.
    @MainActor
    func testViewInAppStoreFallsBackToTheAppStoreLink() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "apps", "-haloDiscover"]
        app.launch()
        app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Things 3'")).firstMatch.tap()
        app.buttons["View in App Store"].tap()
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 15))
    }
}
