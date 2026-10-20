import SwiftUI

struct DeviceDetailView: View {
    let deviceID: String
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let controller = model.smartHome
        let snapshot = controller.provider.snapshot
        NavigationStack {
            if let device = snapshot.devices.first(where: { $0.id == deviceID }) {
                Form {
                    // Controls first so they're visible at the sheet's half height
                    controls(for: device)
                    Section {
                        LabeledContent("Status", value: device.status(unit: model.settings.value.temperatureUnit))
                        if let room = snapshot.rooms.first(where: { $0.id == device.roomID }) {
                            LabeledContent("Room", value: room.name)
                        }
                        if controller.provider.isSimulated {
                            Label("Simulated device. Nothing real is controlled.", systemImage: "flask")
                                .font(.footnote)
                                .foregroundStyle(.orange)
                        }
                    }
                    Section {
                        Toggle("Pin to Home", isOn: Binding(get: { controller.isPinned(device.id) }, set: { _ in controller.togglePin(device.id) }))
                    }
                }
                .disabled(!device.isReachable)
                .navigationTitle(device.name)
            } else {
                ContentUnavailableView("Device Unavailable", systemImage: "questionmark.square.dashed")
            }
        }
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done", systemImage: "checkmark") { dismiss() }
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private func controls(for device: HomeDevice) -> some View {
        let provider = model.smartHome.provider
        let send: (DeviceCommand) -> Void = { command in Task { await provider.send(command, to: device.id) } }
        let unit = model.settings.value.temperatureUnit

        switch device.state {
        case .light(let on, let brightness):
            Section("Light") {
                Toggle("Power", isOn: Binding(get: { on }, set: { send(.setPower($0)) }))
                if let brightness {
                    LabeledContent("Brightness") {
                        Slider(value: Binding(get: { Double(brightness) }, set: { send(.setBrightness(Int($0))) }), in: 1...100, step: 1)
                            .accessibilityValue("\(brightness)%")
                    }
                }
            }
        case .outlet(let on):
            Section { Toggle("Power", isOn: Binding(get: { on }, set: { send(.setPower($0)) })) }
        case .thermostat(let current, let target, let mode):
            Section("Climate") {
                if let current {
                    LabeledContent("Currently", value: Temperature.format(current, unit: unit, decimals: 1))
                }
                Stepper(value: Binding(get: { target }, set: { send(.setTargetTemperature($0)) }), in: ThermostatLimits.range, step: 0.5) {
                    LabeledContent("Target", value: Temperature.formatTarget(target, unit: unit))
                }
                Picker("Mode", selection: Binding(get: { mode }, set: { send(.setThermostatMode($0)) })) {
                    ForEach(ThermostatMode.allCases, id: \.self) { Text($0.title).tag($0) }
                }
                .pickerStyle(.segmented)
            }
        case .lock(let locked):
            Section {
                Button(locked ? "Unlock" : "Lock", systemImage: locked ? "lock.open" : "lock") { send(.setLocked(!locked)) }
            }
        case .sensor:
            Section { Text("This sensor is read-only.").foregroundStyle(.secondary) }
        case .camera:
            Section {
                Text(provider.isSimulated ? "Demo cameras don’t stream." : "Open the Home app to view this camera’s live feed.")
                    .foregroundStyle(.secondary)
            }
        case .unsupported:
            Section { Text("Halo can’t control this accessory yet. Use the Home app.").foregroundStyle(.secondary) }
        }
    }
}
