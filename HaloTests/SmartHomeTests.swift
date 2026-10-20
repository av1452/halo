import Foundation
import HomeKit
import Testing
@testable import Halo

@MainActor
struct DemoHomeTests {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)

    @Test func commandsApplyOnlyToMatchingDeviceTypes() {
        #expect(DemoHomeProvider.apply(.setBrightness(500), to: .light(on: false, brightness: 10)) == .light(on: true, brightness: 100))
        #expect(DemoHomeProvider.apply(.setBrightness(50), to: .light(on: false, brightness: nil)) == .light(on: false, brightness: nil))
        #expect(DemoHomeProvider.apply(.setLocked(true), to: .outlet(on: true)) == .outlet(on: true))
        #expect(DemoHomeProvider.apply(.setTargetTemperature(99), to: .thermostat(current: 20, target: 21, mode: .heat)) == .thermostat(current: 20, target: 30, mode: .heat))
        #expect(DemoHomeProvider.apply(.setTargetTemperature(21.3), to: .thermostat(current: 20, target: 21, mode: .heat)) == .thermostat(current: 20, target: 21.5, mode: .heat))
    }

    @Test func scenesChangeDevicesAndPersist() async {
        let store = JSONStore<DemoHomeProvider.Saved>(name: "demo", directory: directory)
        let demo = DemoHomeProvider(store: store)
        await demo.activateScene("all-off")
        let lightsOn = demo.snapshot.devices.filter { if case .light(true, _) = $0.state { true } else { false } }
        #expect(lightsOn.isEmpty)
        // A fresh provider restores the saved state
        let restored = DemoHomeProvider(store: store)
        #expect(restored.snapshot.devices == demo.snapshot.devices)
    }

    @Test func thermostatDriftsTowardTargetOnlyInTheRightMode() {
        let demo = DemoHomeProvider(store: nil)
        let before = demo.snapshot.devices.first { $0.id == "t-living" }!.state
        demo.tick(random: { 1 })
        let after = demo.snapshot.devices.first { $0.id == "t-living" }!.state
        #expect(before == .thermostat(current: 19.5, target: 21, mode: .heat))
        #expect(after == .thermostat(current: 19.6, target: 21, mode: .heat))
    }

    @Test func formatsHalfDegreeTargets() {
        #expect(Temperature.formatTarget(21.5, unit: .celsius) == "21.5°C")
        #expect(Temperature.formatTarget(21, unit: .celsius) == "21°C")
        #expect(Temperature.formatTarget(21.5, unit: .fahrenheit) == "71°F")
    }
}

struct HomeKitMappingTests {
    @Test func mapsLightsWithAndWithoutBrightness() {
        #expect(HomeKitMapping.state(serviceType: HMServiceTypeLightbulb, values: [HMCharacteristicTypePowerState: 1, HMCharacteristicTypeBrightness: 40]) == .light(on: true, brightness: 40))
        #expect(HomeKitMapping.state(serviceType: HMServiceTypeLightbulb, values: [HMCharacteristicTypePowerState: 0]) == .light(on: false, brightness: nil))
    }

    @Test func mapsThermostatLockAndSensors() {
        #expect(HomeKitMapping.state(serviceType: HMServiceTypeThermostat, values: [HMCharacteristicTypeCurrentTemperature: 19, HMCharacteristicTypeTargetTemperature: 21, HMCharacteristicTypeTargetHeatingCooling: 2]) == .thermostat(current: 19, target: 21, mode: .cool))
        #expect(HomeKitMapping.state(serviceType: HMServiceTypeLockMechanism, values: [HMCharacteristicTypeCurrentLockMechanismState: 1]) == .lock(locked: true))
        #expect(HomeKitMapping.state(serviceType: HMServiceTypeContactSensor, values: [HMCharacteristicTypeContactState: 1]) == .sensor(.contact, value: 1))
        #expect(HomeKitMapping.state(serviceType: "unknown", values: [:]) == .unsupported)
    }

    @Test func writesTheRightCharacteristics() {
        let brightness = HomeKitMapping.write(for: .setBrightness(150), serviceType: HMServiceTypeLightbulb)
        #expect(brightness.map(\.type) == [HMCharacteristicTypePowerState, HMCharacteristicTypeBrightness])
        #expect(brightness.last?.value as? Int == 100)
        #expect(HomeKitMapping.write(for: .setLocked(true), serviceType: HMServiceTypeLockMechanism).first?.value as? Int == 1)
        #expect(HomeKitMapping.write(for: .setThermostatMode(.auto), serviceType: HMServiceTypeThermostat).first?.value as? Int == 3)
        #expect(HomeKitMapping.write(for: .setLocked(true), serviceType: HMServiceTypeLightbulb).isEmpty)
    }
}
