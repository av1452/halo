import SwiftUI

/// A rounded Liquid Glass panel for dashboard cards and grouped content.
struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = 26
    var padding: CGFloat = 16
    var interactive = false
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .glassEffect(interactive ? .regular.interactive() : .regular, in: .rect(cornerRadius: cornerRadius))
    }
}

#Preview {
    ZStack {
        Wallpaper()
        GlassCard {
            Text("Liquid Glass").font(.title2.bold())
        }
    }
}
