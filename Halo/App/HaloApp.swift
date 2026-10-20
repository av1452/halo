import SwiftUI

@main
struct HaloApp: App {
    @State private var model = LaunchOptions.isolatedStorage
        ? AppModel(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
        : AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(model.settings.value.appearance.colorScheme)
                .tint(model.settings.value.accent.color)
        }
    }
}
