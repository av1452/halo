import Foundation

/// A fictional, fully interactive home. None of these devices exist.
@MainActor @Observable
final class DemoHomeProvider: SmartHomeProvider {
    let name = "Demo Home"
    let isSimulated = true
    let availability = SmartHomeAvailability.ready
    let lastError: String? = nil
    private(set) var snapshot: HomeSnapshot { didSet { store?.save(Saved(devices: snapshot.devices.map(SavedDevice.init))) } }

    private let store: JSONStore<Saved>?
    private var simulation: Task<Void, Never>?

    init(store: JSONStore<Saved>? = JSONStore(name: "demo-home")) {
        self.store = store
        var home = Self.initialHome
        if let saved = store?.load() {
            let byID = Dictionary(saved.devices.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
            home.devices = home.devices.map { byID[$0.id]?.applied(to: $0) ?? $0 }
        }
        snapshot = home
    }

    func start() {
        guard simulation == nil else { return }
        simulation = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(4))
                self?.tick()
            }
        }
    }

    func send(_ command: DeviceCommand, to deviceID: String) async {
        guard let i = snapshot.devices.firstIndex(where: { $0.id == deviceID }) else { return }
        snapshot.devices[i].state = Self.apply(command, to: snapshot.devices[i].state)
    }

    func activateScene(_ sceneID: String) async {
        for (deviceID, command) in Self.sceneActions[sceneID] ?? [] {
            await send(command, to: deviceID)
        }
        if sceneID == "all-off" {
            for device in snapshot.devices {
                if case .light = device.state { await send(.setPower(false), to: device.id) }
            }
        }
    }

    func reset() {
        store?.remove()
        snapshot = Self.initialHome
    }

    /// Thermostats drift toward their target; the motion sensor occasionally trips.
    func tick(random: () -> Double = { Double.random(in: 0..<1) }) {
        snapshot.devices = snapshot.devices.map { device in
            var device = device
            switch device.state {
            case .thermostat(let current?, let target, let mode) where mode != .off:
                let diff = target - current
                let canHeat = mode == .heat || mode == .auto
                let canCool = mode == .cool || mode == .auto
                if (diff > 0 && canHeat) || (diff < 0 && canCool) {
                    let step = (diff > 0 ? 1.0 : -1.0) * min(abs(diff), 0.1)
                    device.state = .thermostat(current: ((current + step) * 10).rounded() / 10, target: target, mode: mode)
                }
            case .sensor(.motion, _):
                device.state = .sensor(.motion, value: random() < 0.15 ? 1 : 0)
            default: break
            }
            return device
        }
    }

    // MARK: - Pure state logic

    static func apply(_ command: DeviceCommand, to state: DeviceState) -> DeviceState {
        switch (command, state) {
        case (.setPower(let on), .light(_, let b)): .light(on: on, brightness: b)
        case (.setPower(let on), .outlet): .outlet(on: on)
        case (.setBrightness(let value), .light(_, .some)): .light(on: true, brightness: min(100, max(1, value)))
        case (.setTargetTemperature(let t), .thermostat(let c, _, let m)): .thermostat(current: c, target: ThermostatLimits.clamp(t), mode: m)
        case (.setThermostatMode(let m), .thermostat(let c, let t, _)): .thermostat(current: c, target: t, mode: m)
        case (.setLocked(let locked), .lock): .lock(locked: locked)
        default: state
        }
    }

    // MARK: - Fixture

    static let initialHome = HomeSnapshot(
        homeName: "Demo Home",
        rooms: [
            HomeRoom(id: "living", name: "Living Room"),
            HomeRoom(id: "kitchen", name: "Kitchen"),
            HomeRoom(id: "bedroom", name: "Bedroom"),
            HomeRoom(id: "office", name: "Office"),
            HomeRoom(id: "entry", name: "Entryway"),
        ],
        devices: [
            HomeDevice(id: "l-living-ceiling", name: "Ceiling Light", roomID: "living", state: .light(on: true, brightness: 80)),
            HomeDevice(id: "l-living-lamp", name: "Floor Lamp", roomID: "living", state: .light(on: false, brightness: 45)),
            HomeDevice(id: "p-living-tv", name: "TV", roomID: "living", state: .outlet(on: true)),
            HomeDevice(id: "t-living", name: "Thermostat", roomID: "living", state: .thermostat(current: 19.5, target: 21, mode: .heat)),
            HomeDevice(id: "l-kitchen", name: "Pendants", roomID: "kitchen", state: .light(on: false, brightness: 100)),
            HomeDevice(id: "p-kitchen-kettle", name: "Kettle", roomID: "kitchen", state: .outlet(on: false)),
            HomeDevice(id: "s-kitchen-humidity", name: "Humidity", roomID: "kitchen", state: .sensor(.humidity, value: 48)),
            HomeDevice(id: "l-bedroom", name: "Bedside Lamp", roomID: "bedroom", state: .light(on: false, brightness: 30)),
            HomeDevice(id: "s-bedroom-temp", name: "Temperature", roomID: "bedroom", state: .sensor(.temperature, value: 19.8)),
            HomeDevice(id: "l-office", name: "Desk Light", roomID: "office", state: .light(on: true, brightness: 65)),
            HomeDevice(id: "s-office-motion", name: "Motion", roomID: "office", state: .sensor(.motion, value: 0)),
            HomeDevice(id: "k-entry", name: "Front Door", roomID: "entry", state: .lock(locked: true)),
            HomeDevice(id: "s-entry-contact", name: "Door Sensor", roomID: "entry", state: .sensor(.contact, value: 0)),
            HomeDevice(id: "c-entry", name: "Doorbell", roomID: "entry", state: .camera),
            HomeDevice(id: "l-entry", name: "Porch Light", roomID: "entry", state: .light(on: false, brightness: nil)),
        ],
        scenes: [
            HomeScene(id: "good-morning", name: "Good Morning", systemImage: "sunrise.fill"),
            HomeScene(id: "good-night", name: "Good Night", systemImage: "moon.fill"),
            HomeScene(id: "away", name: "Away", systemImage: "figure.walk.departure"),
            HomeScene(id: "movie-time", name: "Movie Time", systemImage: "film.fill"),
            HomeScene(id: "all-off", name: "All Lights Off", systemImage: "lightbulb.slash.fill"),
        ]
    )

    static let sceneActions: [String: [(String, DeviceCommand)]] = [
        "good-morning": [("l-bedroom", .setBrightness(60)), ("l-kitchen", .setPower(true)), ("t-living", .setTargetTemperature(21)), ("t-living", .setThermostatMode(.heat))],
        "good-night": [("l-living-ceiling", .setPower(false)), ("l-living-lamp", .setPower(false)), ("l-kitchen", .setPower(false)), ("l-office", .setPower(false)), ("l-bedroom", .setBrightness(10)), ("k-entry", .setLocked(true)), ("t-living", .setTargetTemperature(18))],
        "away": [("l-living-ceiling", .setPower(false)), ("l-living-lamp", .setPower(false)), ("l-kitchen", .setPower(false)), ("l-bedroom", .setPower(false)), ("l-office", .setPower(false)), ("l-entry", .setPower(true)), ("k-entry", .setLocked(true)), ("t-living", .setThermostatMode(.auto)), ("t-living", .setTargetTemperature(16))],
        "movie-time": [("l-living-ceiling", .setPower(false)), ("l-living-lamp", .setBrightness(20)), ("p-living-tv", .setPower(true))],
    ]

    // MARK: - Persistence

    struct Saved: Codable { var devices: [SavedDevice] }

    /// Only user-changeable state is saved; anything unknown is ignored on load.
    struct SavedDevice: Codable {
        var id: String
        var on: Bool?
        var brightness: Int?
        var target: Double?
        var current: Double?
        var mode: ThermostatMode?
        var locked: Bool?

        init(_ device: HomeDevice) {
            id = device.id
            switch device.state {
            case .light(let o, let b): on = o; brightness = b
            case .outlet(let o): on = o
            case .thermostat(let c, let t, let m): current = c; target = t; mode = m
            case .lock(let l): locked = l
            default: break
            }
        }

        func applied(to device: HomeDevice) -> HomeDevice {
            var device = device
            switch device.state {
            case .light(let o, let b): device.state = .light(on: on ?? o, brightness: b == nil ? nil : brightness.map { min(100, max(1, $0)) } ?? b)
            case .outlet(let o): device.state = .outlet(on: on ?? o)
            case .thermostat(let c, let t, let m): device.state = .thermostat(current: current ?? c, target: target.map(ThermostatLimits.clamp) ?? t, mode: mode ?? m)
            case .lock(let l): device.state = .lock(locked: locked ?? l)
            default: break
            }
            return device
        }
    }
}
