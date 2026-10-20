import Foundation

enum SmartHomeAvailability: Equatable, Sendable {
    case loading
    case ready
    /// The user hasn't been asked yet, or HomeKit is restricted/denied.
    case needsPermission
    case denied
    /// Permission granted but no home has been set up in the Home app.
    case noHome
}

/// A source of home data and control. The UI only talks to this protocol.
@MainActor
protocol SmartHomeProvider: AnyObject, Observable {
    var name: String { get }
    /// True for the demo; the UI labels everything as simulated.
    var isSimulated: Bool { get }
    var availability: SmartHomeAvailability { get }
    var snapshot: HomeSnapshot { get }
    /// Last error from a command, shown to the user.
    var lastError: String? { get }

    func start()
    func send(_ command: DeviceCommand, to deviceID: String) async
    func activateScene(_ sceneID: String) async
}
