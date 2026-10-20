import SwiftUI

struct SmartHomeView: View {
    @Environment(AppModel.self) private var model
    @State private var roomFilter: String?
    @State private var openDevice: String?

    var body: some View {
        let controller = model.smartHome
        let provider = controller.provider
        let snapshot = provider.snapshot

        SectionScreen(title: "Smart Home", subtitle: provider.availability == .ready ? snapshot.homeName : nil) {
            if provider.isSimulated {
                DemoBanner()
            }
            if let error = provider.lastError {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline)
                    .foregroundStyle(.red)
                    .padding()
                    .glassEffect(in: .rect(cornerRadius: 18))
            }

            if provider.availability == .ready {
                HomeContent(snapshot: snapshot, roomFilter: $roomFilter, openDevice: $openDevice)
            } else {
                ConnectCard(availability: provider.availability)
            }
        }
        .task { controller.start() }
        .sheet(item: Binding(get: { openDevice.map(IdentifiedString.init) }, set: { openDevice = $0?.id })) { item in
            DeviceDetailView(deviceID: item.id)
        }
    }
}

private struct IdentifiedString: Identifiable { let id: String }

private struct HomeContent: View {
    let snapshot: HomeSnapshot
    @Binding var roomFilter: String?
    @Binding var openDevice: String?
    @Environment(AppModel.self) private var model

    private let columns = [GridItem(.adaptive(minimum: 160), spacing: 12)]

    var body: some View {
        let lightsOn = snapshot.devices.filter { if case .light(true, _) = $0.state { true } else { false } }.count
        let unlocked = snapshot.devices.filter { if case .lock(false) = $0.state { true } else { false } }.count

        HStack(spacing: 8) {
            StatusChip(text: "\(lightsOn) light\(lightsOn == 1 ? "" : "s") on", systemImage: "lightbulb")
            StatusChip(text: unlocked == 0 ? "All locked" : "\(unlocked) unlocked", systemImage: unlocked == 0 ? "lock" : "lock.open")
        }

        if !snapshot.scenes.isEmpty {
            SectionGroup(title: "Scenes") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 10)], spacing: 10) {
                    ForEach(snapshot.scenes) { SceneButton(scene: $0) }
                }
            }
        }

        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                FilterChip(title: "All Rooms", isSelected: roomFilter == nil) { roomFilter = nil }
                ForEach(snapshot.rooms) { room in
                    FilterChip(title: room.name, isSelected: roomFilter == room.id) { roomFilter = room.id }
                }
            }
        }
        // Don't clip the glass chips' shadows to a hard-edged band
        .scrollClipDisabled()

        let rooms = roomFilter.map { id in snapshot.rooms.filter { $0.id == id } } ?? snapshot.rooms
        ForEach(rooms) { room in
            let devices = snapshot.devices.filter { $0.roomID == room.id }
            if !devices.isEmpty {
                SectionGroup(title: room.name) {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(devices) { device in DeviceTile(device: device) { openDevice = device.id } }
                    }
                }
            }
        }
        let unassigned = snapshot.devices.filter { device in device.roomID == nil || !snapshot.rooms.contains { $0.id == device.roomID } }
        if roomFilter == nil, !unassigned.isEmpty {
            SectionGroup(title: "Other") {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(unassigned) { device in DeviceTile(device: device) { openDevice = device.id } }
                }
            }
        }
        if snapshot.devices.isEmpty {
            ContentUnavailableView("No Accessories", systemImage: "lightbulb.slash", description: Text("Add accessories in the Home app and they’ll appear here."))
                .padding()
                .glassEffect(in: .rect(cornerRadius: 26))
        }
    }
}

/// Shown until Apple Home is connected, with a way into the demo.
private struct ConnectCard: View {
    let availability: SmartHomeAvailability
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 14) {
                Label(title, systemImage: "house.fill").font(.title3.bold())
                Text(message).foregroundStyle(.secondary)
                // Side by side when there's room, stacked otherwise
                ViewThatFits(in: .horizontal) {
                    HStack { actions }
                    VStack(alignment: .leading) { actions }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var actions: some View {
        if availability == .needsPermission {
            Button("Connect Apple Home") { model.smartHome.homeKit.start() }
                .buttonStyle(.glassProminent)
        }
        if availability == .denied {
            Button("Open Settings") { openURL(URL(string: UIApplication.openSettingsURLString)!) }
                .buttonStyle(.glassProminent)
        }
        Button("Try the Demo Home") {
            model.smartHome.usingDemo = true
            model.smartHome.start()
        }
        .buttonStyle(.glass)
        .fixedSize()
    }

    private var title: String {
        switch availability {
        case .denied: "Home Access Is Off"
        case .noHome: "No Home Set Up"
        default: "Connect Apple Home"
        }
    }

    private var message: String {
        switch availability {
        case .denied: "Allow Halo to use Home data in Settings to see and control your accessories."
        case .noHome: "Set up a home in Apple’s Home app, then your rooms, accessories and scenes will appear here."
        case .loading: "Checking your Apple Home…"
        default: "Halo can show and control the accessories, rooms and scenes in your Apple Home. You’ll be asked for permission."
        }
    }
}

private struct DemoBanner: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "flask.fill").foregroundStyle(.orange)
            VStack(alignment: .leading, spacing: 6) {
                Text("Demo Home").font(.headline)
                Text("These devices are simulated. Nothing in your home is controlled.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Button("Use Apple Home Instead") {
                    model.smartHome.usingDemo = false
                    model.smartHome.start()
                }
                .font(.subheadline.bold())
            }
            Spacer(minLength: 0)
        }
        .padding()
        .glassEffect(.regular.tint(.orange.opacity(0.15)), in: .rect(cornerRadius: 22))
    }
}

struct StatusChip: View {
    let text: String
    let systemImage: String

    var body: some View {
        Label(text, systemImage: systemImage)
            .font(.subheadline.weight(.medium))
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .glassEffect(in: .capsule)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        // Two concrete branches rather than a type-erased (AnyView) style,
        // which made SwiftUI do slow runtime type lookups on every update
        Group {
            if isSelected {
                Button(title, action: action).buttonStyle(.glassProminent)
            } else {
                Button(title, action: action).buttonStyle(.glass)
            }
        }
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
