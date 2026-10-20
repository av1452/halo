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
