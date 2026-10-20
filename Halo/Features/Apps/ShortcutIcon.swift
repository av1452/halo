import SwiftUI

/// A shortcut's real icon (App Store artwork or the website's touch icon),
/// falling back to a generated tile until one is available.
struct ShortcutIcon: View {
    let shortcut: Shortcut
    var size: CGFloat = 62
    @Environment(AppModel.self) private var model

    var body: some View {
        Group {
            if let image = model.icons.image(for: shortcut) {
                Image(uiImage: image)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFill()
                    .frame(width: size, height: size)
                    .clipShape(.rect(cornerRadius: size * 0.225, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: size * 0.225, style: .continuous)
                            .strokeBorder(.primary.opacity(0.08), lineWidth: 0.5)
                    }
                    .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
                    .accessibilityHidden(true)
            } else {
                AppIconView(symbol: shortcut.symbol, colorHex: shortcut.colorHex, size: size)
            }
        }
        // Keyed on the icon source so previews update as the address changes
        .task(id: IconProvider.key(for: shortcut)) { await model.icons.load([shortcut]) }
    }
}
