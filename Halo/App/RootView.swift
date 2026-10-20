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
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
    }

    @ViewBuilder
    private func view(for section: AppSection) -> some View {
        switch section {
        case .smartHome: SmartHomeView()
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
