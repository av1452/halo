import Foundation

/// Halo's provider-neutral view of a home. HomeKit and the demo both map onto these types.
struct HomeSnapshot: Equatable, Sendable {
    var homeName: String
    var rooms: [HomeRoom]
    var devices: [HomeDevice]
    var scenes: [HomeScene]

    static let empty = HomeSnapshot(homeName: "", rooms: [], devices: [], scenes: [])
}

struct HomeRoom: Identifiable, Equatable, Sendable {
    let id: String
    var name: String
}

struct HomeScene: Identifiable, Equatable, Sendable {
    let id: String
    var name: String
    var systemImage: String
}

enum ThermostatMode: String, CaseIterable, Codable, Sendable {
    case off, heat, cool, auto
    var title: String { rawValue.capitalized }
}

enum SensorKind: String, Codable, Sendable {
    case temperature, humidity, motion, contact
}

enum DeviceState: Equatable, Sendable {
    case light(on: Bool, brightness: Int?)          // brightness 1–100, nil if not dimmable
    case outlet(on: Bool)
    case thermostat(current: Double?, target: Double, mode: ThermostatMode)
    case lock(locked: Bool)
    case sensor(SensorKind, value: Double?)
    case camera
    case unsupported
}

struct HomeDevice: Identifiable, Equatable, Sendable {
    let id: String
    var name: String
    var roomID: String?
    var state: DeviceState
    var isReachable = true
}

/// User-initiated changes. Providers apply what makes sense for the device.
enum DeviceCommand: Equatable, Sendable {
    case setPower(Bool)
    case setBrightness(Int)
    case setTargetTemperature(Double)
    case setThermostatMode(ThermostatMode)
    case setLocked(Bool)
}

enum ThermostatLimits {
    static let range = 10.0...30.0
    static func clamp(_ value: Double) -> Double {
        min(range.upperBound, max(range.lowerBound, (value * 2).rounded() / 2))
    }
}

extension HomeDevice {
    /// Whether the tile should use its bright "on" style.
    var isActive: Bool {
        switch state {
        case .light(let on, _), .outlet(let on): on
        case .thermostat(_, _, let mode): mode != .off
        case .lock(let locked): !locked
        case .sensor(let kind, let value): (kind == .motion || kind == .contact) && value == 1
        case .camera, .unsupported: false
        }
    }

    /// The command a single tap performs, if the device has one.
    var primaryToggle: DeviceCommand? {
        switch state {
        case .light(let on, _), .outlet(let on): .setPower(!on)
        case .lock(let locked): .setLocked(!locked)
        default: nil
        }
    }

    var systemImage: String {
        switch state {
        case .light(let on, _): on ? "lightbulb.fill" : "lightbulb"
        case .outlet(let on): on ? "poweroutlet.type.b.fill" : "poweroutlet.type.b"
        case .thermostat: "thermometer.medium"
        case .lock(let locked): locked ? "lock.fill" : "lock.open.fill"
        case .sensor(.temperature, _): "thermometer"
        case .sensor(.humidity, _): "humidity"
        case .sensor(.motion, let v): v == 1 ? "figure.walk.motion" : "figure.stand"
        case .sensor(.contact, let v): v == 1 ? "door.left.hand.open" : "door.left.hand.closed"
        case .camera: "video"
        case .unsupported: "questionmark.square.dashed"
        }
    }

    func status(unit: TemperatureUnit) -> String {
        guard isReachable else { return "No Response" }
        switch state {
        case .light(let on, let brightness):
            guard on else { return "Off" }
            return brightness.map { "\($0)%" } ?? "On"
        case .outlet(let on): return on ? "On" : "Off"
        case .thermostat(let current, let target, let mode):
            let now = current.map { Temperature.format($0, unit: unit, decimals: 1) } ?? "—"
            return mode == .off ? "Off · \(now)" : "\(mode.title) to \(Temperature.formatTarget(target, unit: unit)) · \(now)"
        case .lock(let locked): return locked ? "Locked" : "Unlocked"
        case .sensor(.temperature, let v): return v.map { Temperature.format($0, unit: unit, decimals: 1) } ?? "—"
        case .sensor(.humidity, let v): return v.map { "\(Int($0.rounded()))%" } ?? "—"
        case .sensor(.motion, let v): return v == 1 ? "Motion Detected" : "No Motion"
        case .sensor(.contact, let v): return v == 1 ? "Open" : "Closed"
        case .camera: return "Camera"
        case .unsupported: return "Not supported in Halo"
        }
    }
}

enum Temperature {
    /// Targets move in 0.5°C steps; show the half degree in Celsius instead of rounding it away.
    static func formatTarget(_ celsius: Double, unit: TemperatureUnit) -> String {
        let fractional = unit == .celsius && celsius.rounded() != celsius
        return format(celsius, unit: unit, decimals: fractional ? 1 : 0)
    }

    static func format(_ celsius: Double, unit: TemperatureUnit, decimals: Int = 0) -> String {
        let value = unit == .fahrenheit ? celsius * 9 / 5 + 32 : celsius
        return value.formatted(.number.precision(.fractionLength(decimals))) + unit.symbol
    }
}
