import XCTest

final class SearchUITests: XCTestCase {
    @MainActor
    func testSearchFindsAndOpensADevice() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "search", "-haloDemoHome"]
        app.launch()
        let field = app.searchFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("front door")
        let result = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Front Door'")).firstMatch
        XCTAssertTrue(result.waitForExistence(timeout: 5))
        result.tap()
        XCTAssertTrue(app.navigationBars["Front Door"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testSearchRunsAScene() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-haloResetData", "-haloSection", "search", "-haloDemoHome"]
        app.launch()
        let field = app.searchFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("all lights")
        app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'All Lights Off'")).firstMatch.tap()
        XCTAssertTrue(app.staticTexts["All Lights Off set (demo)"].waitForExistence(timeout: 5))
    }
}
