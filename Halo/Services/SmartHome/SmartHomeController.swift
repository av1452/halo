import Foundation

/// Chooses between Apple Home and the demo, and remembers pinned devices.
@MainActor @Observable
final class SmartHomeController {
    let homeKit: HomeKitProvider
    let demo: DemoHomeProvider
    private let settings: SettingsStore

    private(set) var pinned: [String] { didSet { pinStore.save(pinned) } }
    private let pinStore: JSONStore<[String]>

    init(settings: SettingsStore, directory: URL) {
        self.settings = settings
        homeKit = HomeKitProvider()
        demo = DemoHomeProvider(store: JSONStore(name: "demo-home", directory: directory))
        pinStore = JSONStore(name: "smart-home-pins", directory: directory)
        pinned = pinStore.load() ?? ["l-living-ceiling", "t-living", "l-bedroom", "k-entry"]
    }

    var usingDemo: Bool {
        get { settings.value.smartHomeDemo }
        set { settings.value.smartHomeDemo = newValue }
    }

    var provider: any SmartHomeProvider { usingDemo ? demo : homeKit }

    /// Starts the active provider. For HomeKit this shows the permission prompt the first time.
    func start() {
        provider.start()
    }

    func isPinned(_ id: String) -> Bool { pinned.contains(id) }

    func togglePin(_ id: String) {
        if let i = pinned.firstIndex(of: id) { pinned.remove(at: i) } else { pinned.append(id) }
    }

    func resetDemo() { demo.reset() }
}
