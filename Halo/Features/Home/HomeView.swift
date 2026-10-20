import SwiftUI

struct HomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var customizing = false

    var body: some View {
        TimelineView(.everyMinute) { context in
            SectionScreen(title: greeting(at: context.date), subtitle: context.date.formatted(.dateTime.weekday(.wide).month(.wide).day())) {
                let items = model.dashboard.items
                if items.isEmpty {
                    ContentUnavailableView {
                        Label("Your Home Is Empty", systemImage: "square.grid.2x2")
                    } actions: {
                        Button("Customize Home") { customizing = true }.buttonStyle(.glassProminent)
                    }
                    .glassEffect(in: .rect(cornerRadius: 28))
                }
                ForEach(Array(DashboardStore.rows(for: items, columns: sizeClass == .regular ? 2 : 1).enumerated()), id: \.offset) { _, row in
                    HStack(alignment: .top, spacing: 16) {
                        ForEach(row) { item in widget(item.widget, date: context.date) }
                    }
                }
                // Inside the content so it lands in SectionScreen's NavigationStack
                Color.clear.frame(height: 0)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Customize Home", systemImage: "slider.horizontal.3") { customizing = true }
                        }
                    }
            }
        }
        .sheet(isPresented: $customizing) { CustomizeHomeView() }
    }

    private func greeting(at date: Date) -> String {
        let hour = Calendar.current.component(.hour, from: date)
        let base = switch hour {
        case 5..<12: "Good Morning"
        case 12..<18: "Good Afternoon"
        default: "Good Evening"
        }
        let name = model.settings.value.displayName.trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? base : "\(base), \(name)"
    }

    @ViewBuilder
    private func widget(_ widget: DashboardWidget, date: Date) -> some View {
        switch widget {
        case .clock: ClockWidget(date: date)
        case .weather: WeatherWidget()
        case .calendar: CalendarWidget()
        case .reminders: RemindersWidget()
        case .smartHome: SmartHomeWidget()
        case .favorites: FavoritesWidget()
        case .nowPlaying: NowPlayingCard(compact: true)
        case .quickActions: QuickActionsWidget { customizing = true }
        case .notes: NotesWidget()
        }
    }
}

/// Show, hide, reorder and resize dashboard widgets.
struct CustomizeHomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let dashboard = model.dashboard
        NavigationStack {
            List {
                Section {
                    ForEach(dashboard.items) { item in
                        HStack {
                            Button("Remove \(item.widget.title)", systemImage: "minus.circle.fill", role: .destructive) {
                                withAnimation { dashboard.remove(item.widget) }
                            }
                            .labelStyle(.iconOnly)
                            .foregroundStyle(.red)
                            .buttonStyle(.borderless)
                            Label(item.widget.title, systemImage: item.widget.systemImage)
                            Spacer()
                            Button(item.isWide ? "Wide" : "Regular") { dashboard.toggleWide(item.widget) }
                                .buttonStyle(.bordered)
                                .accessibilityLabel("\(item.widget.title) size, \(item.isWide ? "wide" : "regular")")
                        }
                    }
                    .onMove { dashboard.move(from: $0, to: $1) }
                } header: {
                    Text("On Home")
                } footer: {
                    Text("Wide widgets span both columns on iPad.")
                }
                if !dashboard.hidden.isEmpty {
                    Section("More Widgets") {
                        ForEach(dashboard.hidden) { widget in
                            Button { dashboard.add(widget) } label: {
                                Label(widget.title, systemImage: widget.systemImage)
                            }
                            .accessibilityLabel("Add \(widget.title)")
                        }
                    }
                }
            }
            .environment(\.editMode, .constant(.active))
            .navigationTitle("Customize Home")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done", systemImage: "checkmark") { dismiss() } } }
        }
    }
}
