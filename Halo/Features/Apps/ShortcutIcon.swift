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
                // Pre-sized bitmap, a cheap continuous-corner clip and no shadow:
                // shadows need an offscreen pass per icon on every frame while scrolling.
                Image(uiImage: image)
                    .resizable()
                    .frame(width: size, height: size)
                    .clipShape(.rect(cornerRadius: size * 0.225, style: .continuous))
                    .accessibilityHidden(true)
            } else {
                AppIconView(symbol: shortcut.symbol, colorHex: shortcut.colorHex, size: size)
            }
        }
        // Keyed on the icon source so previews update as the address changes
        .task(id: IconProvider.key(for: shortcut)) { await model.icons.load([shortcut]) }
    }
}
