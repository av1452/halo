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
            ScrollView {
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
