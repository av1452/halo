import SwiftUI

/// An app-style icon: an SF Symbol on the shortcut's color with a glassy highlight.
struct AppIconView: View {
    let symbol: String
    let colorHex: UInt32
    var size: CGFloat = 62

    var body: some View {
        let color = Color.hex(colorHex)
        RoundedRectangle(cornerRadius: size * 0.235, style: .continuous)
            .fill(LinearGradient(colors: [color.mix(with: .white, by: 0.18), color], startPoint: .top, endPoint: .bottom))
            .overlay {
                Image(systemName: symbol)
                    .font(.system(size: size * 0.44, weight: .semibold))
                    .foregroundStyle(.white)
                    .symbolRenderingMode(.hierarchical)
            }
            .overlay {
                // Specular edge, like iOS 26 icons
                RoundedRectangle(cornerRadius: size * 0.235, style: .continuous)
                    .strokeBorder(LinearGradient(colors: [.white.opacity(0.55), .white.opacity(0.05)], startPoint: .top, endPoint: .bottom), lineWidth: 1)
            }
            .frame(width: size, height: size)
            .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
            .accessibilityHidden(true)
    }
}

#Preview {
    AppIconView(symbol: "music.note", colorHex: 0xFA2D48)
}
