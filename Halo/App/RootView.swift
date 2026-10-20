import SwiftUI

/// Halo's shell: a Liquid Glass tab bar with a separate search button on
/// iPhone, which becomes a sidebar on iPad. Settings opens as a sheet from
/// the gear button in each section's toolbar.
struct RootView: View {
    @State private var selection: AppSection = .home
    @State private var showingSettings = false

    var body: some View {
        TabView(selection: $selection) {
            ForEach(AppSection.tabs) { section in
                Tab(section.title, systemImage: section.systemImage, value: section) {
                    SectionPlaceholder(section: section, showingSettings: $showingSettings)
                }
            }
            Tab(value: AppSection.search, role: .search) {
                SectionPlaceholder(section: .search, showingSettings: $showingSettings)
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tabBarMinimizeBehavior(.onScrollDown)
        .sheet(isPresented: $showingSettings) {
            NavigationStack {
                Text("Settings")
                    .navigationTitle("Settings")
            }
        }
    }
}

/// Toolbar button that opens Settings, shared by every section.
struct SettingsToolbarButton: ToolbarContent {
    @Binding var showingSettings: Bool

    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button("Settings", systemImage: "gearshape") { showingSettings = true }
        }
    }
}

/// Temporary content until each section is built.
private struct SectionPlaceholder: View {
    let section: AppSection
    @Binding var showingSettings: Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                GlassCard {
                    Label("Coming soon", systemImage: section.systemImage)
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
            }
            .background { Wallpaper() }
            .navigationTitle(section.title)
            .toolbar { SettingsToolbarButton(showingSettings: $showingSettings) }
        }
    }
}

#Preview {
    RootView()
}
