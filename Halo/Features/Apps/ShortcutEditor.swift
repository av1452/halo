import SwiftUI

/// Add or edit a shortcut. Prefills from a Discover listing when given one.
struct ShortcutEditor: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    private let original: Shortcut?
    @State private var draft: Shortcut
    @State private var address: String
    @State private var folder: String
    @State private var showError = false

    static let symbols = ["globe", "link", "star.fill", "heart.fill", "book.fill", "music.note", "play.fill", "tv.fill", "gamecontroller.fill", "cart.fill", "creditcard.fill", "camera.fill", "map.fill", "airplane", "briefcase.fill", "graduationcap.fill", "newspaper.fill", "bubble.left.fill", "envelope.fill", "house.fill"]
    static let colors: [UInt32] = [0x0A84FF, 0x5E5CE6, 0xBF5AF2, 0xFF375F, 0xFF6B35, 0xFF9F0A, 0x30B158, 0x40B3C8, 0x1C1C1E, 0x8E8E93]

    init(shortcut: Shortcut?, prefill: Shortcut? = nil) {
        original = shortcut
        let start = shortcut ?? prefill ?? Shortcut(name: "", url: "", symbol: "globe", colorHex: Self.colors[0])
        _draft = State(initialValue: start)
        _address = State(initialValue: start.url)
        _folder = State(initialValue: start.folder ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Spacer()
                        ShortcutIcon(shortcut: previewShortcut, size: 76)
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                }
                Section {
                    TextField("Name", text: $draft.name)
                        .accessibilityIdentifier("shortcut-name")
                    TextField("Address", text: $address, prompt: Text("example.com or app-name://"))
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityIdentifier("shortcut-address")
                } footer: {
                    Text(showError && ShortcutURL.normalize(address) == nil
                         ? "Enter a web address like example.com, or an app link like spotify:."
                         : "Websites, Universal Links, mailto:, tel: and app URL schemes work.")
                        .foregroundStyle(showError && ShortcutURL.normalize(address) == nil ? .red : .secondary)
                }
                Section("Folder") {
                    TextField("None", text: $folder)
                    if !model.launcher.folders.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(model.launcher.folders, id: \.self) { name in
                                    Button(name) { folder = name }.buttonStyle(.bordered)
                                }
                            }
                        }
                    }
                }
                Section {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 36))], spacing: 10) {
                        ForEach(Self.colors, id: \.self) { hex in
                            Button { draft.colorHex = hex } label: {
                                Circle().fill(Color.hex(hex)).frame(width: 30, height: 30)
                                    .overlay { if draft.colorHex == hex { Image(systemName: "checkmark").font(.caption.bold()).foregroundStyle(.white) } }
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(String(format: "Color #%06X", hex))
                            .accessibilityAddTraits(draft.colorHex == hex ? .isSelected : [])
                        }
                    }
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 40))], spacing: 10) {
                        ForEach(Self.symbols, id: \.self) { symbol in
                            Button { draft.symbol = symbol } label: {
                                Image(systemName: symbol)
                                    .frame(width: 36, height: 36)
                                    .background(draft.symbol == symbol ? Color.accentColor.opacity(0.2) : .clear, in: .rect(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(symbol)
                            .accessibilityAddTraits(draft.symbol == symbol ? .isSelected : [])
                        }
                    }
                } header: {
                    Text("Fallback Icon")
                } footer: {
                    Text("Halo shows the app’s App Store icon or the website’s own icon when it can find one. This color and symbol are used otherwise.")
                }
                Section {
                    Toggle("Favorite", isOn: $draft.isFavorite)
                }
            }
            .navigationTitle(original == nil ? "New Shortcut" : "Edit Shortcut")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel", systemImage: "xmark") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(original == nil ? "Add" : "Save", systemImage: "checkmark", action: save)
                        .disabled(draft.name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    /// The draft as it would be saved, so the preview shows the real icon for the typed address.
    private var previewShortcut: Shortcut {
        var preview = draft
        if let url = ShortcutURL.normalize(address) {
            preview.url = url.absoluteString
            if preview.appStoreID == nil { preview.appStoreID = ShortcutURL.appStoreID(in: url) }
        }
        return preview
    }

    private func save() {
        guard let url = ShortcutURL.normalize(address) else {
            showError = true
            return
        }
        draft.url = url.absoluteString
        if draft.appStoreID == nil { draft.appStoreID = ShortcutURL.appStoreID(in: url) }
        draft.name = draft.name.trimmingCharacters(in: .whitespaces)
        draft.folder = folder.trimmingCharacters(in: .whitespaces).isEmpty ? nil : folder.trimmingCharacters(in: .whitespaces)
        if original == nil { model.launcher.add(draft) } else { model.launcher.update(draft) }
        dismiss()
    }
}
