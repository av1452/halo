import SwiftUI

/// Halo's shell: a Liquid Glass tab bar with a separate search button on
/// iPhone, which becomes a sidebar on iPad. Settings opens as a sheet from
/// the gear button in each section's toolbar.
struct RootView: View {
    @State private var selection: AppSection = LaunchOptions.initialSection
    @State private var showingSettings = LaunchOptions.openSettings

    var body: some View {
        TabView(selection: $selection) {
            ForEach(AppSection.tabs) { section in
                Tab(section.title, systemImage: section.systemImage, value: section) {
                    view(for: section)
                }
            }
            Tab(value: AppSection.search, role: .search) {
                view(for: .search)
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tabBarMinimizeBehavior(.onScrollDown)
        .environment(\.openSettings, { showingSettings = true })
        .environment(\.selectSection, { selection = $0 })
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
        #if DEBUG || BENCHMARK
        .task {
            // Debug-only tab-switching benchmark (-haloBenchTabs)
            guard ProcessInfo.processInfo.arguments.contains("-haloBenchTabs") else { return }
            try? await Task.sleep(for: .seconds(3))
            FrameMonitor.shared.start()
            let tour: [AppSection] = [.apps, .smartHome, .media, .home]
            // First visits build each tab; repeat visits show the cost of switching alone
            FrameMonitor.shared.reset()
            for section in tour { selection = section; try? await Task.sleep(for: .seconds(0.8)) }
            let first = FrameMonitor.shared.summary
            FrameMonitor.shared.reset()
            for section in tour + tour { selection = section; try? await Task.sleep(for: .seconds(0.8)) }
            print("BENCH tabs: first[\(first)] repeat[\(FrameMonitor.shared.summary)]")
        }
        #endif
    }

    @ViewBuilder
    private func view(for section: AppSection) -> some View {
        switch section {
        case .home: HomeView()
        case .smartHome: SmartHomeView()
        case .apps: AppsView()
        case .media: MediaView()
        case .search: SearchView()
        default: placeholder(for: section)
        }
    }

    private func placeholder(for section: AppSection) -> some View {
        SectionScreen(title: section.title) {
            GlassCard {
                Label("Coming soon", systemImage: section.systemImage)
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

#Preview {
    RootView().environment(AppModel())
}
