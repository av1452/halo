#if DEBUG || BENCHMARK
import SwiftUI
import UIKit

/// Debug-only: counts late frames so UI tests can measure smoothness.
/// Enabled with the `-haloFrameMonitor` launch argument.
@MainActor
final class FrameMonitor: NSObject {
    static let shared = FrameMonitor()

    private var link: CADisplayLink?
    private var last: CFTimeInterval = 0
    private(set) var frames = 0
    private(set) var hitches = 0
    /// Total time frames were late, in milliseconds
    private(set) var hitchMilliseconds = 0.0
    private(set) var worstMilliseconds = 0.0
    var onChange: (() -> Void)?

    func start() {
        guard link == nil else { return }
        let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
        link.add(to: .main, forMode: .common)
        self.link = link
    }

    func reset() {
        frames = 0; hitches = 0; hitchMilliseconds = 0; worstMilliseconds = 0; last = 0
    }

    @objc private func tick(_ link: CADisplayLink) {
        defer { last = link.timestamp }
        guard last > 0 else { return }
        let expected = link.targetTimestamp - link.timestamp
        let actual = link.timestamp - last
        frames += 1
        // A frame is late if it took noticeably longer than one refresh interval
        if expected > 0, actual > expected * 1.5 {
            hitches += 1
            hitchMilliseconds += (actual - expected) * 1000
        }
        worstMilliseconds = max(worstMilliseconds, actual * 1000)
        if frames % 30 == 0 { onChange?() }
    }

    var summary: String {
        String(format: "frames=%d hitches=%d hitchMs=%.0f worstMs=%.0f", frames, hitches, hitchMilliseconds, worstMilliseconds)
    }
}

/// Invisible overlay exposing the stats to UI tests, with a hidden reset button.
struct FrameMonitorOverlay: View {
    @State private var summary = ""

    var body: some View {
        VStack {
            Text(summary).accessibilityIdentifier("frame-stats")
            Button("Reset Frame Stats") { FrameMonitor.shared.reset(); summary = FrameMonitor.shared.summary }
                .accessibilityIdentifier("frame-reset")
        }
        .font(.system(size: 1))
        .opacity(0.02)
        .allowsHitTesting(true)
        .onAppear {
            FrameMonitor.shared.start()
            FrameMonitor.shared.onChange = { summary = FrameMonitor.shared.summary }
        }
    }
}
#endif
