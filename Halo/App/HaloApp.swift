import SwiftUI

@main
struct HaloApp: App {
    @State private var model = LaunchOptions.isolatedStorage
        ? AppModel(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
        : AppModel()

    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(model.settings.value.appearance.colorScheme)
                .tint(model.settings.value.accent.color)
                #if DEBUG || BENCHMARK
                .overlay(alignment: .topLeading) {
                    if ProcessInfo.processInfo.arguments.contains("-haloFrameMonitor") { FrameMonitorOverlay() }
                }
                #endif
                // Pick up apps installed or deleted while Halo was in the background
                .onChange(of: scenePhase, initial: true) { _, phase in
                    if phase == .active { model.syncInstalledApps() }
                }
        }
    }
}
