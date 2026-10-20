import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var settings = model.settings
        NavigationStack {
            Form {
                Section {
                    TextField("Your name", text: $settings.value.displayName)
                        .textContentType(.givenName)
                } header: {
                    Text("Profile")
                } footer: {
                    Text("Used only for the greeting on Home. Stored on this device.")
                }

                Section("Appearance") {
                    Picker("Theme", selection: $settings.value.appearance) {
                        ForEach(AppearancePreference.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    AccentPicker(selection: $settings.value.accent)
                    WallpaperPicker(selection: $settings.value.wallpaper)
                }

                Section {
                    Toggle("Add Installed Apps", isOn: $settings.value.detectInstalledApps)
                } header: {
                    Text("Apps")
                } footer: {
                    Text("Halo adds popular apps it finds on this device, like Spotify or WhatsApp, with their real icons, and removes them when you delete them. iOS doesn’t let apps see everything installed, so Halo can only check for \(KnownApps.all.count) well-known apps. Add others from Discover.")
                }
                SmartHomeSettings()
                DataSettings()
                PrivacySettings()

                Section("Units") {
                    Picker("Temperature", selection: $settings.value.temperatureUnit) {
                        ForEach(TemperatureUnit.allCases) { Text($0.symbol).tag($0) }
                    }
                }

                Section {
                    LabeledContent("Version", value: Bundle.main.appVersion)
                    Text("Halo is an independent project and isn’t affiliated with or endorsed by Apple.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } header: {
                    Text("About")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done", systemImage: "checkmark") { dismiss() }
                }
            }
        }
    }
}

private struct AccentPicker: View {
    @Binding var selection: AccentChoice

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Accent Color")
            HStack(spacing: 12) {
                ForEach(AccentChoice.allCases) { accent in
                    Button {
                        selection = accent
                    } label: {
                        Circle()
                            .fill(accent.color)
                            .frame(width: 30, height: 30)
                            .overlay {
                                if selection == accent {
                                    Image(systemName: "checkmark").font(.caption.bold()).foregroundStyle(.white)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(accent.title)
                    .accessibilityAddTraits(selection == accent ? .isSelected : [])
                }
            }
        }
        .padding(.vertical, 4)
    }
}

private struct WallpaperPicker: View {
    @Binding var selection: WallpaperStyle

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Wallpaper")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(WallpaperStyle.allCases) { style in
                        Button {
                            selection = style
                        } label: {
                            Wallpaper(style: style)
                                .frame(width: 64, height: 96)
                                .clipShape(.rect(cornerRadius: 14))
                                .overlay(alignment: .bottom) {
                                    Text(style.name).font(.caption2.bold()).foregroundStyle(.white).shadow(radius: 2).padding(6)
                                }
                                .overlay {
                                    RoundedRectangle(cornerRadius: 14)
                                        .strokeBorder(selection == style ? Color.accentColor : .clear, lineWidth: 3)
                                }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(style.name) wallpaper")
                        .accessibilityAddTraits(selection == style ? .isSelected : [])
                    }
                }
                .padding(2)
            }
        }
        .padding(.vertical, 4)
    }
}

extension Bundle {
    var appVersion: String {
        let version = infoDictionary?["CFBundleShortVersionString"] as? String ?? "?"
        let build = infoDictionary?["CFBundleVersion"] as? String ?? "?"
        return "\(version) (\(build))"
    }
}

private struct SmartHomeSettings: View {
    @Environment(AppModel.self) private var model
    @State private var confirmReset = false

    var body: some View {
        @Bindable var controller = model.smartHome
        Section {
            Picker("Source", selection: $controller.usingDemo) {
                Text("Apple Home").tag(false)
                Text("Demo Home").tag(true)
            }
            .pickerStyle(.segmented)
            if controller.usingDemo {
                Button("Reset Demo Home", role: .destructive) { confirmReset = true }
            }
        } header: {
            Text("Smart Home")
        } footer: {
            Text(controller.usingDemo ? "The demo home is simulated. Nothing real is controlled." : "Halo uses HomeKit to show and control your Apple Home.")
        }
        .confirmationDialog("Reset the demo home?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Reset Demo Home", role: .destructive) { model.smartHome.resetDemo() }
        } message: {
            Text("All simulated devices return to their starting state.")
        }
    }
}

private struct DataSettings: View {
    @Environment(AppModel.self) private var model
    @State private var exportDocument: BackupDocument?
    @State private var importing = false
    @State private var pending: HaloBackup?
    @State private var confirmReset = false
    @State private var message: String?

    var body: some View {
        Section {
            Button("Export Backup", systemImage: "square.and.arrow.up") {
                exportDocument = (try? model.makeBackup().encoded()).map(BackupDocument.init)
            }
            Button("Import Backup", systemImage: "square.and.arrow.down") { importing = true }
            Button("Reset Halo", systemImage: "arrow.counterclockwise", role: .destructive) { confirmReset = true }
        } header: {
            Text("Data")
        } footer: {
            Text("Backups are JSON files with your settings, shortcuts, Home layout, Discover favorites, notes and pinned devices. Apple Home, Calendar and Reminders data stay in Apple’s apps and aren’t included.")
        }
        .fileExporter(isPresented: Binding(get: { exportDocument != nil }, set: { if !$0 { exportDocument = nil } }),
                      document: exportDocument, contentType: .json,
                      defaultFilename: "halo-backup-\(Date.now.formatted(.iso8601.year().month().day()))") { result in
            if case .success = result { message = "Backup exported." }
        }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.json]) { result in
            do {
                let url = try result.get()
                let accessing = url.startAccessingSecurityScopedResource()
                defer { if accessing { url.stopAccessingSecurityScopedResource() } }
                pending = try HaloBackup.decode(Data(contentsOf: url))
            } catch let error as HaloBackup.ImportError {
                message = error.localizedDescription
            } catch {
                message = "That file couldn’t be read."
            }
        }
        .confirmationDialog("Import this backup?", isPresented: Binding(get: { pending != nil }, set: { if !$0 { pending = nil } }), titleVisibility: .visible, presenting: pending) { backup in
            Button("Import") {
                Task {
                    let applied = await model.apply(backup)
                    message = applied.isEmpty ? "Nothing in that backup could be imported." : "Imported: \(applied.joined(separator: ", "))."
                }
            }
        } message: { backup in
            Text("This replaces: \(backup.sections.joined(separator: ", ")).")
        }
        .confirmationDialog("Reset Halo?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Erase & Reset", role: .destructive) {
                model.resetAll()
                message = "Halo was reset to its defaults."
            }
        } message: {
            Text("Your shortcuts, Home layout, notes and settings will be erased from this device. Your Apple Home, calendars and reminders aren’t affected.")
        }
        .alert(message ?? "", isPresented: Binding(get: { message != nil }, set: { if !$0 { message = nil } })) {
            Button("OK", role: .cancel) {}
        }
    }
}

private struct PrivacySettings: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Section {
            LabeledContent("Apple Home", value: describe(model.smartHome.homeKit.availability))
            LabeledContent("Apple Music", value: describe(model.music.access))
            LabeledContent("Calendar", value: describe(model.calendar.eventAccess))
            LabeledContent("Reminders", value: describe(model.calendar.reminderAccess))
        } header: {
            Text("Privacy")
        } footer: {
            Text("Halo has no accounts, analytics or tracking. It contacts Apple’s App Store search service when you browse Discover (it receives the app ID or your search term) and Open-Meteo only after you choose a weather location (it receives coordinates rounded to about 1 km). Everything else stays on this device.")
        }
    }

    private func describe(_ availability: SmartHomeAvailability) -> String {
        switch availability {
        case .ready, .noHome: "Allowed"
        case .denied: "Off"
        case .needsPermission: "Not asked"
        case .loading: "Not asked yet"
        }
    }

    private func describe(_ access: MusicController.Access) -> String {
        switch access {
        case .authorized: "Allowed"
        case .denied: "Off"
        case .notDetermined: "Not asked"
        }
    }

    private func describe(_ access: CalendarController.Access) -> String {
        switch access {
        case .authorized: "Allowed"
        case .denied: "Off"
        case .notDetermined: "Not asked"
        }
    }
}
