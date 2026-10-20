import SwiftUI

/// Halo's gradient wallpapers, drawn with MeshGradient behind Liquid Glass.
enum WallpaperStyle: String, CaseIterable, Identifiable, Codable {
    case dusk, lagoon, ember, meadow, graphite

    var id: String { rawValue }
    var name: String { rawValue.capitalized }

    func colors(dark: Bool) -> [Color] {
        switch (self, dark) {
        case (.dusk, false): [.hex(0x8FB8FF), .hex(0x6F8FF0), .hex(0xA07FD8), .hex(0x7F8CF0), .hex(0xA98BE0), .hex(0xD39AC8), .hex(0xB68AD8), .hex(0xE79BB6), .hex(0xF4A6C1)]
        case (.dusk, true): [.hex(0x22357A), .hex(0x10183A), .hex(0x2A1A48), .hex(0x16224F), .hex(0x241A46), .hex(0x3A1A44), .hex(0x2A1A48), .hex(0x3A1530), .hex(0x5A2148)]
        case (.lagoon, false): [.hex(0x6CC4F0), .hex(0x5AA8EA), .hex(0x4F8FE0), .hex(0x67C9D8), .hex(0x5AB0DC), .hex(0x4F9AD8), .hex(0x7FE3D0), .hex(0x57C7B0), .hex(0x4F9FD0)]
        case (.lagoon, true): [.hex(0x0B2A44), .hex(0x0B2240), .hex(0x0B1F3A), .hex(0x0C3340), .hex(0x0C2A3C), .hex(0x0B2238), .hex(0x0F4A48), .hex(0x0D3B36), .hex(0x0B2A3A)]
        case (.ember, false): [.hex(0xFFD27A), .hex(0xFFAE70), .hex(0xFF9A6B), .hex(0xFF9A6B), .hex(0xF67C76), .hex(0xF0607A), .hex(0xD86A9A), .hex(0xB866B8), .hex(0x9A5FD0)]
        case (.ember, true): [.hex(0x5A3510), .hex(0x4A2414), .hex(0x3D1A12), .hex(0x3D1A12), .hex(0x3A161C), .hex(0x3A1222), .hex(0x30132E), .hex(0x281436), .hex(0x23143E)]
        case (.meadow, false): [.hex(0xD8F5A0), .hex(0xB8E896), .hex(0x9FDC8C), .hex(0xA6E2A0), .hex(0x7FCC9A), .hex(0x5FBF9A), .hex(0x6FC4B0), .hex(0x56AEB8), .hex(0x4A9CC0)]
        case (.meadow, true): [.hex(0x24401A), .hex(0x1C3418), .hex(0x142A18), .hex(0x18341C), .hex(0x122C20), .hex(0x0F2A26), .hex(0x10282C), .hex(0x0F2530), .hex(0x0E2234)]
        case (.graphite, false): [.hex(0xFFFFFF), .hex(0xE9EBF0), .hex(0xD9DCE3), .hex(0xE6E8EE), .hex(0xD3D7DF), .hex(0xC9CDD6), .hex(0xCDD1DA), .hex(0xC2C7D1), .hex(0xB9BEC9)]
        case (.graphite, true): [.hex(0x3A3A40), .hex(0x2A2A30), .hex(0x1C1C20), .hex(0x2A2A30), .hex(0x1E1E22), .hex(0x141416), .hex(0x1C1C20), .hex(0x121214), .hex(0x0C0C0E)]
        }
    }
}

struct Wallpaper: View {
    var style: WallpaperStyle = .dusk
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        MeshGradient(
            width: 3,
            height: 3,
            points: [
                [0, 0], [0.5, 0], [1, 0],
                [0, 0.5], [0.55, 0.45], [1, 0.5],
                [0, 1], [0.5, 1], [1, 1],
            ],
            colors: style.colors(dark: colorScheme == .dark)
        )
        .ignoresSafeArea()
        .accessibilityHidden(true)
    }
}

extension Color {
    static func hex(_ value: UInt32) -> Color {
        Color(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

#Preview {
    Wallpaper(style: .lagoon)
}
