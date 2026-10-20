import Foundation
import HomeKit

/// Turns HomeKit service and characteristic types into Halo's device states.
/// Pure and free of HomeKit objects so it can be unit-tested.
enum HomeKitMapping {
    static let supportedServiceTypes: Set<String> = [
        HMServiceTypeLightbulb, HMServiceTypeOutlet, HMServiceTypeSwitch, HMServiceTypeThermostat,
        HMServiceTypeLockMechanism, HMServiceTypeTemperatureSensor, HMServiceTypeHumiditySensor,
        HMServiceTypeMotionSensor, HMServiceTypeContactSensor,
    ]

    /// Characteristics Halo reads (and subscribes to) for each service type.
    static let observedCharacteristics: Set<String> = [
        HMCharacteristicTypePowerState, HMCharacteristicTypeBrightness, HMCharacteristicTypeCurrentTemperature,
        HMCharacteristicTypeTargetTemperature, HMCharacteristicTypeTargetHeatingCooling,
        HMCharacteristicTypeCurrentLockMechanismState, HMCharacteristicTypeTargetLockMechanismState,
        HMCharacteristicTypeCurrentRelativeHumidity, HMCharacteristicTypeMotionDetected, HMCharacteristicTypeContactState,
    ]

    /// `values` maps characteristic types to their last known numeric value (Bools as 0/1).
    static func state(serviceType: String, values: [String: Double]) -> DeviceState {
        switch serviceType {
        case HMServiceTypeLightbulb:
            return .light(on: values[HMCharacteristicTypePowerState] == 1, brightness: values[HMCharacteristicTypeBrightness].map { Int($0) })
        case HMServiceTypeOutlet, HMServiceTypeSwitch:
            return .outlet(on: values[HMCharacteristicTypePowerState] == 1)
        case HMServiceTypeThermostat:
            let mode: ThermostatMode = switch Int(values[HMCharacteristicTypeTargetHeatingCooling] ?? 0) {
            case 1: .heat
            case 2: .cool
            case 3: .auto
            default: .off
            }
            return .thermostat(current: values[HMCharacteristicTypeCurrentTemperature], target: values[HMCharacteristicTypeTargetTemperature] ?? 20, mode: mode)
        case HMServiceTypeLockMechanism:
            // 1 = secured. Prefer the current state; fall back to the target.
            let raw = values[HMCharacteristicTypeCurrentLockMechanismState] ?? values[HMCharacteristicTypeTargetLockMechanismState]
            return .lock(locked: raw == 1)
        case HMServiceTypeTemperatureSensor:
            return .sensor(.temperature, value: values[HMCharacteristicTypeCurrentTemperature])
        case HMServiceTypeHumiditySensor:
            return .sensor(.humidity, value: values[HMCharacteristicTypeCurrentRelativeHumidity])
        case HMServiceTypeMotionSensor:
            return .sensor(.motion, value: values[HMCharacteristicTypeMotionDetected])
        case HMServiceTypeContactSensor:
            // HomeKit: 0 = contact detected (closed), 1 = not detected (open)
            return .sensor(.contact, value: values[HMCharacteristicTypeContactState])
        default:
            return .unsupported
        }
    }

    /// The characteristic type and value to write for a command on a service.
    static func write(for command: DeviceCommand, serviceType: String) -> [(type: String, value: Any)] {
        switch (command, serviceType) {
        case (.setPower(let on), HMServiceTypeLightbulb), (.setPower(let on), HMServiceTypeOutlet), (.setPower(let on), HMServiceTypeSwitch):
            [(HMCharacteristicTypePowerState, on)]
        case (.setBrightness(let value), HMServiceTypeLightbulb):
            [(HMCharacteristicTypePowerState, true), (HMCharacteristicTypeBrightness, min(100, max(1, value)))]
        case (.setTargetTemperature(let t), HMServiceTypeThermostat):
            [(HMCharacteristicTypeTargetTemperature, ThermostatLimits.clamp(t))]
        case (.setThermostatMode(let mode), HMServiceTypeThermostat):
            [(HMCharacteristicTypeTargetHeatingCooling, [ThermostatMode.off: 0, .heat: 1, .cool: 2, .auto: 3][mode] ?? 0)]
        case (.setLocked(let locked), HMServiceTypeLockMechanism):
            [(HMCharacteristicTypeTargetLockMechanismState, locked ? 1 : 0)]
        default:
            []
        }
    }

    static func sceneSymbol(for actionSetType: String) -> String {
        switch actionSetType {
        case HMActionSetTypeWakeUp: "sunrise.fill"
        case HMActionSetTypeSleep: "moon.fill"
        case HMActionSetTypeHomeDeparture: "figure.walk.departure"
        case HMActionSetTypeHomeArrival: "house.fill"
        default: "sparkles"
        }
    }
}

/// Your real Apple Home, through the HomeKit framework.
@MainActor @Observable
final class HomeKitProvider: NSObject, SmartHomeProvider {
    let name = "Apple Home"
    let isSimulated = false
    private(set) var availability = SmartHomeAvailability.loading
    private(set) var snapshot = HomeSnapshot.empty
    private(set) var lastError: String?

    @ObservationIgnored private var manager: HMHomeManager?

    private var home: HMHome? { manager?.homes.first }

    func start() {
        guard manager == nil else { return }
        // Creating the manager triggers the permission prompt on first use
        let manager = HMHomeManager()
        manager.delegate = self
        self.manager = manager
    }

    func send(_ command: DeviceCommand, to deviceID: String) async {
        guard let service = service(id: deviceID) else { return }
        lastError = nil
        for (type, value) in HomeKitMapping.write(for: command, serviceType: service.serviceType) {
            guard let characteristic = service.characteristics.first(where: { $0.characteristicType == type }) else { continue }
            do {
                try await characteristic.writeValue(value)
            } catch {
                lastError = "\(service.accessory?.name ?? "The accessory") didn’t respond: \(error.localizedDescription)"
                break
            }
        }
        rebuild()
    }

    func activateScene(_ sceneID: String) async {
        guard let home, let actionSet = home.actionSets.first(where: { $0.uniqueIdentifier.uuidString == sceneID }) else { return }
        lastError = nil
        do {
            try await home.executeActionSet(actionSet)
        } catch {
            lastError = "\(actionSet.name) couldn’t run: \(error.localizedDescription)"
        }
        rebuild()
    }

    // MARK: - Snapshot

    private func service(id: String) -> HMService? {
        home?.accessories.lazy.flatMap(\.services).first { $0.uniqueIdentifier.uuidString == id }
    }

    private func updateAvailability() {
        guard let manager else { return }
        let status = manager.authorizationStatus
        if !status.contains(.determined) {
            availability = .needsPermission
        } else if status.contains(.restricted) || !status.contains(.authorized) {
            availability = .denied
        } else if manager.homes.isEmpty {
            availability = .noHome
        } else {
            availability = .ready
        }
    }

    private func rebuild() {
        updateAvailability()
        guard let home else {
            snapshot = .empty
            return
        }
        var devices: [HomeDevice] = []
        for accessory in home.accessories {
            let roomID = accessory.room?.uniqueIdentifier.uuidString
            if !accessory.cameraProfiles.isNilOrEmpty {
                devices.append(HomeDevice(id: accessory.uniqueIdentifier.uuidString, name: accessory.name, roomID: roomID, state: .camera, isReachable: accessory.isReachable))
            }
            for service in accessory.services where HomeKitMapping.supportedServiceTypes.contains(service.serviceType) {
                var values: [String: Double] = [:]
                for characteristic in service.characteristics {
                    if let number = characteristic.value as? NSNumber { values[characteristic.characteristicType] = number.doubleValue }
                }
                let name = service.name.isEmpty ? accessory.name : service.name
                devices.append(HomeDevice(
                    id: service.uniqueIdentifier.uuidString,
                    name: name,
                    roomID: roomID,
                    state: HomeKitMapping.state(serviceType: service.serviceType, values: values),
                    isReachable: accessory.isReachable
                ))
            }
        }
        snapshot = HomeSnapshot(
            homeName: home.name,
            rooms: home.rooms.map { HomeRoom(id: $0.uniqueIdentifier.uuidString, name: $0.name) },
            devices: devices,
            scenes: home.actionSets
                .filter { $0.actionSetType != HMActionSetTypeTriggerOwned }
                .map { HomeScene(id: $0.uniqueIdentifier.uuidString, name: $0.name, systemImage: HomeKitMapping.sceneSymbol(for: $0.actionSetType)) }
        )
    }

    /// Reads current values and subscribes to changes for everything Halo shows.
    private func observe(_ home: HMHome) {
        for accessory in home.accessories {
            accessory.delegate = self
            for service in accessory.services where HomeKitMapping.supportedServiceTypes.contains(service.serviceType) {
                for characteristic in service.characteristics where HomeKitMapping.observedCharacteristics.contains(characteristic.characteristicType) {
                    Task {
                        try? await characteristic.readValue()
                        if characteristic.properties.contains(HMCharacteristicPropertySupportsEventNotification) {
                            try? await characteristic.enableNotification(true)
                        }
                        self.rebuild()
                    }
                }
            }
        }
    }
}

extension HomeKitProvider: @preconcurrency HMHomeManagerDelegate {
    func homeManagerDidUpdateHomes(_ manager: HMHomeManager) {
        if let home { observe(home) }
        rebuild()
    }

    func homeManager(_ manager: HMHomeManager, didUpdate status: HMHomeManagerAuthorizationStatus) {
        rebuild()
    }
}

extension HomeKitProvider: @preconcurrency HMAccessoryDelegate {
    func accessory(_ accessory: HMAccessory, service: HMService, didUpdateValueFor characteristic: HMCharacteristic) {
        rebuild()
    }

    func accessoryDidUpdateReachability(_ accessory: HMAccessory) {
        rebuild()
    }
}

private extension Optional where Wrapped: Collection {
    var isNilOrEmpty: Bool { self?.isEmpty ?? true }
}
