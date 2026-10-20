import SwiftUI

/// Common frame for dashboard widgets.
struct WidgetFrame<Content: View, Accessory: View>: View {
    let widget: DashboardWidget
    @ViewBuilder var content: Content
    @ViewBuilder var accessory: Accessory

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(widget.title, systemImage: widget.systemImage)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                Spacer()
                accessory
            }
            content
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(18)
        .glassEffect(in: .rect(cornerRadius: 28))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(widget.title)
    }
}

extension WidgetFrame where Accessory == EmptyView {
    init(widget: DashboardWidget, @ViewBuilder content: () -> Content) {
        self.init(widget: widget, content: content) { EmptyView() }
    }
}

// MARK: - Clock

struct ClockWidget: View {
    /// Supplied by HomeView's per-minute timeline; the time itself is a system-updated Text.
    let date: Date

    var body: some View {
        WidgetFrame(widget: .clock) {
            VStack(alignment: .leading, spacing: 4) {
                Text(.now, style: .time)
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                Text(date, format: .dateTime.weekday(.wide).month().day())
                    .foregroundStyle(.secondary)
                Text(TimeZone.current.identifier.replacingOccurrences(of: "_", with: " "))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
    }
}

// MARK: - Weather

struct WeatherWidget: View {
    @Environment(AppModel.self) private var model
    @State private var choosingPlace = false

    var body: some View {
        let weather = model.weather
        WidgetFrame(widget: .weather) {
            if let place = weather.place {
                Button { choosingPlace = true } label: {
                    Label(place.name, systemImage: "location.fill").font(.subheadline.bold())
                }
                .buttonStyle(.plain)
                .accessibilityHint("Changes the weather location")
                if let report = weather.report {
                    let condition = report.condition
                    HStack(spacing: 14) {
                        Image(systemName: condition.symbol)
                            .symbolRenderingMode(.multicolor)
                            .font(.system(size: 44))
                            .accessibilityHidden(true)
                        VStack(alignment: .leading) {
                            Text(Temperature.format(report.temperature, unit: model.settings.value.temperatureUnit))
                                .font(.system(size: 40, weight: .semibold, design: .rounded))
                            Text("\(condition.label) · H \(Temperature.format(report.high, unit: model.settings.value.temperatureUnit)) L \(Temperature.format(report.low, unit: model.settings.value.temperatureUnit))")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Text("Updated \(report.fetchedAt, format: .dateTime.hour().minute()) · Open-Meteo")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                } else if weather.loading {
                    ProgressView()
                }
                if let error = weather.error {
                    Label(error, systemImage: "exclamationmark.triangle").font(.caption).foregroundStyle(.red)
                }
            } else {
                Text("Choose a location to see live weather. Halo doesn’t show weather until you do.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Button("Set Location", systemImage: "location") { choosingPlace = true }
                    .buttonStyle(.glassProminent)
            }
        } accessory: {
            if weather.place != nil {
                Button("Refresh", systemImage: "arrow.clockwise") { Task { await weather.refresh() } }
                    .labelStyle(.iconOnly)
                    .disabled(weather.loading)
            }
        }
        .task { await weather.refreshIfStale() }
        .sheet(isPresented: $choosingPlace) { PlacePicker() }
    }
}

private struct PlacePicker: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var results: [WeatherPlace] = []
    @State private var searching = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button("Use My Current Location", systemImage: "location.fill") {
                        Task {
                            await model.weather.useCurrentLocation()
                            if model.weather.place != nil { dismiss() }
                        }
                    }
                    .disabled(model.weather.locating)
                } footer: {
                    Text("Your location is rounded to about 1 km. Only those coordinates are sent to Open-Meteo for the forecast.")
                }
                if !results.isEmpty {
                    Section("Results") {
                        ForEach(results, id: \.name) { place in
                            Button(place.name) {
                                Task { await model.weather.setPlace(place); dismiss() }
                            }
                        }
                    }
                }
                if model.weather.place != nil {
                    Section {
                        Button("Remove Location", role: .destructive) { Task { await model.weather.setPlace(nil); dismiss() } }
                    }
                }
            }
            .overlay { if searching { ProgressView() } }
            .searchable(text: $query, prompt: "Search for a city")
            .onSubmit(of: .search) {
                Task {
                    searching = true
                    results = await model.weather.search(query)
                    searching = false
                }
            }
            .navigationTitle("Weather Location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel", systemImage: "xmark") { dismiss() } } }
        }
    }
}

// MARK: - Calendar and Reminders

struct CalendarWidget: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let calendar = model.calendar
        WidgetFrame(widget: .calendar) {
            switch calendar.eventAccess {
            case .notDetermined:
                AccessPrompt(text: "Show your upcoming events from Calendar.") { await calendar.requestEventAccess() }
            case .denied:
                SettingsPrompt(text: "Calendar access is off. Turn on Full Access for Halo in Settings.")
            case .authorized:
                if calendar.events.isEmpty {
                    Text("Nothing in the next 7 days.").foregroundStyle(.secondary)
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(calendar.events.prefix(4)) { event in
                            HStack(alignment: .top, spacing: 10) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(event.calendarColor.map { Color(cgColor: $0) } ?? .accentColor)
                                    .frame(width: 4, height: 34)
                                VStack(alignment: .leading) {
                                    Text(event.title).font(.subheadline.bold()).lineLimit(1)
                                    Text(event.isAllDay ? event.start.formatted(.dateTime.weekday().month().day()) + " · All day"
                                                        : event.start.formatted(.dateTime.weekday().hour().minute()))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .accessibilityElement(children: .combine)
                        }
                    }
                }
            }
        }
        .task { await calendar.refresh() }
    }
}

struct RemindersWidget: View {
    @Environment(AppModel.self) private var model
    @State private var newTitle = ""

    var body: some View {
        let calendar = model.calendar
        WidgetFrame(widget: .reminders) {
            switch calendar.reminderAccess {
            case .notDetermined:
                AccessPrompt(text: "Show and complete your reminders from the Reminders app.") { await calendar.requestReminderAccess() }
            case .denied:
                SettingsPrompt(text: "Reminders access is off. Turn on Full Access for Halo in Settings.")
            case .authorized:
                VStack(alignment: .leading, spacing: 8) {
                    if calendar.reminders.isEmpty {
                        Text("All done.").foregroundStyle(.secondary)
                    }
                    ForEach(calendar.reminders.prefix(5)) { reminder in
                        Button {
                            Task { await calendar.complete(reminder.id) }
                        } label: {
                            HStack {
                                Image(systemName: "circle").foregroundStyle(.secondary)
                                Text(reminder.title).lineLimit(1)
                                Spacer()
                                if let due = reminder.due {
                                    Text(due, format: .dateTime.month().day())
                                        .font(.caption)
                                        .foregroundStyle(due < Calendar.current.startOfDay(for: .now) ? .red : .secondary)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Complete \(reminder.title)")
                    }
                    HStack {
                        TextField("New Reminder", text: $newTitle)
                            .onSubmit(add)
                        Button("Add Reminder", systemImage: "plus.circle.fill", action: add)
                            .labelStyle(.iconOnly)
                            .disabled(newTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    .padding(.top, 4)
                    if let error = calendar.lastError {
                        Text(error).font(.caption).foregroundStyle(.red)
                    }
                }
            }
        }
        .task { await calendar.refresh() }
    }

    private func add() {
        let title = newTitle
        newTitle = ""
        Task { await model.calendar.addReminder(title, due: nil) }
    }
}

private struct AccessPrompt: View {
    let text: String
    let request: () async -> Void

    var body: some View {
        Text(text).font(.subheadline).foregroundStyle(.secondary)
        Button("Allow Access") { Task { await request() } }.buttonStyle(.glassProminent)
    }
}

private struct SettingsPrompt: View {
    let text: String
    @Environment(\.openURL) private var openURL

    var body: some View {
        Text(text).font(.subheadline).foregroundStyle(.secondary)
        Button("Open Settings") { openURL(URL(string: UIApplication.openSettingsURLString)!) }.buttonStyle(.glass)
    }
}

// MARK: - Smart Home, Favorites, Quick Actions, Notes

struct SmartHomeWidget: View {
    @Environment(AppModel.self) private var model
    @Environment(\.selectSection) private var selectSection
    @State private var openDevice: String?

    var body: some View {
        let controller = model.smartHome
        let provider = controller.provider
        WidgetFrame(widget: .smartHome) {
            if provider.availability == .ready {
                let pinned = provider.snapshot.devices.filter { controller.isPinned($0.id) }
                if !provider.snapshot.scenes.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack { ForEach(provider.snapshot.scenes.prefix(5)) { SceneButton(scene: $0).fixedSize() } }
                    }
                    .scrollClipDisabled()
                }
                if pinned.isEmpty {
                    Text("Pin devices from Smart Home to show them here.").font(.subheadline).foregroundStyle(.secondary)
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 10)], spacing: 10) {
                        ForEach(pinned) { device in
                            DeviceTile(device: device, roomName: provider.snapshot.rooms.first { $0.id == device.roomID }?.name) { openDevice = device.id }
                        }
                    }
                }
            } else {
                Text("Connect Apple Home or try the demo in Smart Home.").font(.subheadline).foregroundStyle(.secondary)
                Button("Open Smart Home") { selectSection(.smartHome) }.buttonStyle(.glass)
            }
        } accessory: {
            HStack(spacing: 8) {
                if provider.isSimulated {
                    Label("Demo", systemImage: "flask").font(.caption.bold()).foregroundStyle(.orange)
                }
                Button("All Devices") { selectSection(.smartHome) }.font(.subheadline.bold())
            }
        }
        .task { if controller.usingDemo || controller.homeKit.availability != .loading { controller.start() } }
        .sheet(item: Binding(get: { openDevice.map(DeviceID.init) }, set: { openDevice = $0?.id })) { DeviceDetailView(deviceID: $0.id) }
    }

    private struct DeviceID: Identifiable { let id: String }
}

struct FavoritesWidget: View {
    @Environment(AppModel.self) private var model
    @Environment(\.selectSection) private var selectSection

    var body: some View {
        let favorites = model.launcher.shortcuts.filter(\.isFavorite)
        WidgetFrame(widget: .favorites) {
            if favorites.isEmpty {
                Text("Favorite apps in Apps to pin them here.").font(.subheadline).foregroundStyle(.secondary)
            } else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 68), spacing: 8)], spacing: 14) {
                    ForEach(favorites.prefix(8)) { shortcut in
                        Button { Task { await model.opener.open(shortcut) } } label: {
                            VStack(spacing: 6) {
                                ShortcutIcon(shortcut: shortcut, size: 54)
                                Text(shortcut.name).font(.caption.weight(.medium)).lineLimit(1)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(shortcut.name)
                    }
                }
            }
        } accessory: {
            Button("All Apps") { selectSection(.apps) }.font(.subheadline.bold())
        }
    }
}

struct QuickActionsWidget: View {
    let customize: () -> Void
    @Environment(AppModel.self) private var model
    @State private var addingShortcut = false

    var body: some View {
        WidgetFrame(widget: .quickActions) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                action("New Shortcut", "plus") { addingShortcut = true }
                action("Good Night", "moon.fill") { Task { await runScene(named: "Good Night") } }
                action("Lights Off", "lightbulb.slash.fill") { Task { await runScene(named: "All Lights Off") } }
                action("Customize", "slider.horizontal.3", customize)
            }
        }
        .sheet(isPresented: $addingShortcut) { ShortcutEditor(shortcut: nil) }
    }

    private func action(_ title: String, _ symbol: String, _ run: @escaping () -> Void) -> some View {
        Button(action: run) {
            Label(title, systemImage: symbol)
                .font(.subheadline.bold())
                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
        }
        .buttonStyle(.glass)
    }

    /// Runs a scene with this name in the active home (HomeKit or demo), if it has one.
    private func runScene(named name: String) async {
        let provider = model.smartHome.provider
        if let scene = provider.snapshot.scenes.first(where: { $0.name.localizedCaseInsensitiveCompare(name) == .orderedSame }) {
            await provider.activateScene(scene.id)
        }
    }
}

struct NotesWidget: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var notes = model.notes
        WidgetFrame(widget: .notes) {
            TextEditor(text: $notes.text)
                .frame(minHeight: 120)
                .scrollContentBackground(.hidden)
                .accessibilityLabel("Notes")
        }
    }
}

// MARK: - Switching tabs from inside a section

private struct SelectSectionKey: EnvironmentKey {
    static let defaultValue: @MainActor @Sendable (AppSection) -> Void = { _ in }
}

extension EnvironmentValues {
    var selectSection: @MainActor @Sendable (AppSection) -> Void {
        get { self[SelectSectionKey.self] }
        set { self[SelectSectionKey.self] = newValue }
    }
}
