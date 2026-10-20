import SwiftUI

/// Shared layout for every section: large title, the chosen wallpaper behind
/// Liquid Glass content, and the Settings button. Sections add their own
/// toolbar items with `.toolbar` on their content.
struct SectionScreen<Content: View>: View {
    let title: String
    var subtitle: String?
    /// Adds a navigation search field when provided
    var search: Binding<String>?
    var searchPrompt = "Search"
    @ViewBuilder var content: Content

    @Environment(AppModel.self) private var model
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
            ScrollView {
                Color.clear.frame(height: 0).id(BenchmarkAnchor.top)
                VStack(alignment: .leading, spacing: 20) {
                    if let subtitle {
                        Text(subtitle)
                            .font(.headline)
                            .foregroundStyle(.secondary)
                    }
                    content
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
                .frame(maxWidth: 1100)
                .frame(maxWidth: .infinity)
                Color.clear.frame(height: 0).id(BenchmarkAnchor.bottom)
            }
            #if DEBUG || BENCHMARK
            .task { await Benchmark.autoScroll(proxy) }
            #endif
            }
            .scrollContentBackground(.hidden)
            .background { Wallpaper(style: model.settings.value.wallpaper) }
            .navigationTitle(title)
            .modifier(OptionalSearch(text: search, prompt: searchPrompt))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Settings", systemImage: "gearshape") { openSettings() }
                }
            }
        }
    }
}

private struct OptionalSearch: ViewModifier {
    let text: Binding<String>?
    let prompt: String

    func body(content: Content) -> some View {
        if let text {
            content.searchable(text: text, prompt: prompt)
        } else {
            content
        }
    }
}

/// A titled group of content inside a section.
struct SectionGroup<Content: View, Trailing: View>: View {
    let title: String
    @ViewBuilder var content: Content
    @ViewBuilder var trailing: Trailing

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title).font(.title3.bold())
                Spacer()
                trailing
            }
            .accessibilityElement(children: .contain)
            content
        }
    }
}

extension SectionGroup where Trailing == EmptyView {
    init(title: String, @ViewBuilder content: () -> Content) {
        self.init(title: title, content: content) { EmptyView() }
    }
}

// MARK: - Opening Settings from anywhere

private struct OpenSettingsKey: EnvironmentKey {
    static let defaultValue: @MainActor @Sendable () -> Void = {}
}

extension EnvironmentValues {
    var openSettings: @MainActor @Sendable () -> Void {
        get { self[OpenSettingsKey.self] }
        set { self[OpenSettingsKey.self] = newValue }
    }
}

enum BenchmarkAnchor: Hashable { case top, bottom }


#if DEBUG || BENCHMARK
/// Debug-only benchmarks driven by launch arguments, so frame timing can be
/// measured without XCTest (whose accessibility queries slow the app down).
@MainActor
enum Benchmark {

    static func autoScroll(_ proxy: ScrollViewProxy) async {
        guard ProcessInfo.processInfo.arguments.contains("-haloBenchScroll") else { return }
        try? await Task.sleep(for: .seconds(3))  // let data and icons load
        FrameMonitor.shared.start()
        FrameMonitor.shared.reset()
        for _ in 0..<3 {
            withAnimation(.easeInOut(duration: 1.0)) { proxy.scrollTo(BenchmarkAnchor.bottom, anchor: .bottom) }
            try? await Task.sleep(for: .seconds(1.3))
            withAnimation(.easeInOut(duration: 1.0)) { proxy.scrollTo(BenchmarkAnchor.top, anchor: .top) }
            try? await Task.sleep(for: .seconds(1.3))
        }
        print("BENCH scroll: \(FrameMonitor.shared.summary)")
    }
}
#endif
