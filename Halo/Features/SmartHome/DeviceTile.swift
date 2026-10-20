import SwiftUI

/// A device tile: tap toggles lights, outlets and locks; other devices open their controls.
struct DeviceTile: View {
    let device: HomeDevice
    var roomName: String?
    let onOpen: () -> Void

    @Environment(AppModel.self) private var model

    var body: some View {
        let controller = model.smartHome
        Button {
            if let toggle = device.primaryToggle, device.isReachable {
                Task { await controller.provider.send(toggle, to: device.id) }
            } else {
                onOpen()
            }
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    Image(systemName: device.systemImage)
                        .font(.title3)
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(device.isActive ? Color.orange : Color.secondary)
                        .frame(width: 36, height: 36)
                        .background(device.isActive ? Color.orange.opacity(0.18) : Color.secondary.opacity(0.15), in: .circle)
                    Spacer()
                    if controller.isPinned(device.id) {
                        Image(systemName: "pin.fill").font(.caption2).foregroundStyle(.secondary)
                            .accessibilityHidden(true)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    if let roomName {
                        Text(roomName).font(.caption).foregroundStyle(.secondary)
                    }
                    Text(device.name).font(.subheadline.bold()).lineLimit(1)
                    Text(device.status(unit: model.settings.value.temperatureUnit))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 100, alignment: .topLeading)
            .padding(14)
            .foregroundStyle(device.isActive ? Color.black : Color.primary)
            .glassEffect(device.isActive ? .regular.tint(.white.opacity(0.85)).interactive() : .regular.interactive(), in: .rect(cornerRadius: 22))
        }
        .buttonStyle(.plain)
        .opacity(device.isReachable ? 1 : 0.6)
        .accessibilityLabel(device.name)
        .accessibilityValue(device.status(unit: model.settings.value.temperatureUnit))
        .accessibilityAddTraits(device.primaryToggle != nil && device.isActive ? .isSelected : [])
        .accessibilityHint(device.primaryToggle == nil ? "Opens controls" : "Toggles the device")
        .accessibilityAction(named: "Controls", onOpen)
        .contextMenu {
            Button("Controls", systemImage: "slider.horizontal.3", action: onOpen)
            Button(controller.isPinned(device.id) ? "Unpin from Home" : "Pin to Home", systemImage: controller.isPinned(device.id) ? "pin.slash" : "pin") {
                controller.togglePin(device.id)
            }
        }
    }
}

struct SceneButton: View {
    let scene: HomeScene
    @Environment(AppModel.self) private var model

    var body: some View {
        Button {
            Task { await model.smartHome.provider.activateScene(scene.id) }
        } label: {
            Label(scene.name, systemImage: scene.systemImage)
                .font(.subheadline.bold())
                .frame(maxWidth: .infinity, minHeight: 34, alignment: .leading)
        }
        .buttonStyle(.glass)
        .controlSize(.large)
    }
}
