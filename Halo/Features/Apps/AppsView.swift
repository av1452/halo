import SwiftUI

/// The Apps tab: your launcher and, alongside it, Discover.
struct AppsView: View {
    enum Mode: String, CaseIterable { case myApps = "My Apps", discover = "Discover" }

    @State private var mode: Mode = LaunchOptions.initialAppsMode
    @State private var query = ""

    var body: some View {
        SectionScreen(title: mode == .myApps ? "Apps" : "Discover", search: $query, searchPrompt: mode == .myApps ? "Search your apps" : "Search apps") {
            Picker("View", selection: $mode) {
                ForEach(Mode.allCases, id: \.self) { Text($0.rawValue) }
            }
            .pickerStyle(.segmented)

            switch mode {
            case .myApps: LauncherView(query: $query)
            case .discover: DiscoverView(query: $query)
            }
        }
    }
}
