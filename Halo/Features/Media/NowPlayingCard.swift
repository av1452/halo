import SwiftUI

/// Now Playing from the Music app, with playback controls.
struct NowPlayingCard: View {
    var compact = false
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL

    var body: some View {
        let music = model.music
        GlassCard(cornerRadius: 30, padding: 18) {
            Group {
                switch music.access {
                case .notDetermined:
                    message("Apple Music", "Allow access to show what’s playing in the Music app and control it from Halo.") {
                        Button("Allow Access") { Task { await music.requestAccess() } }.buttonStyle(.glassProminent)
                    }
                case .denied:
                    message("Music Access Is Off", "Turn on Media & Apple Music for Halo in Settings to see what’s playing.") {
                        Button("Open Settings") { openURL(URL(string: UIApplication.openSettingsURLString)!) }.buttonStyle(.glassProminent)
                    }
                case .authorized:
                    if let item = music.nowPlaying {
                        playing(item)
                    } else {
                        message("Nothing Playing", "Start something in the Music app and it’ll appear here.") {
                            if let musicApp = AppleApps.all.first(where: { $0.name == "Music" }) {
                                if model.opener.isInstalled(musicApp) {
                                    Button("Open Music") { Task { await model.opener.open(musicApp) } }.buttonStyle(.glass)
                                } else if let id = musicApp.appStoreID {
                                    Button("Get Apple Music") { Task { await StoreProductPresenter.present(appStoreID: id) } }.buttonStyle(.glass)
                                }
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .task { music.start() }
    }

    private func message<Actions: View>(_ title: String, _ text: String, @ViewBuilder actions: () -> Actions) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: "music.note")
                .font(.title2)
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(LinearGradient(colors: [.pink, .red], startPoint: .top, endPoint: .bottom), in: .rect(cornerRadius: 14))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 8) {
                Text(title).font(.headline)
                Text(text).font(.subheadline).foregroundStyle(.secondary)
                actions()
            }
        }
    }

    private func playing(_ item: MusicController.NowPlaying) -> some View {
        let music = model.music
        return VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                Group {
                    if let artwork = item.artwork {
                        Image(uiImage: artwork).resizable().scaledToFill()
                    } else {
                        Image(systemName: "music.note").font(.title).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, maxHeight: .infinity).background(.quaternary)
                    }
                }
                .frame(width: compact ? 64 : 88, height: compact ? 64 : 88)
                .clipShape(.rect(cornerRadius: 14))
                .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Now Playing").font(.caption.bold()).foregroundStyle(.secondary).textCase(.uppercase)
                    Text(item.title).font(.headline).lineLimit(1)
                    Text([item.artist, item.album].filter { !$0.isEmpty }.joined(separator: " — ")).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                }
            }
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                let time = music.playbackTime
                VStack(spacing: 4) {
                    ProgressView(value: min(time, item.duration), total: max(item.duration, 1))
                        .accessibilityLabel("Playback position")
                        .accessibilityValue("\(MusicController.format(time)) of \(MusicController.format(item.duration))")
                    HStack {
                        Text(MusicController.format(time))
                        Spacer()
                        Text(MusicController.format(item.duration))
                    }
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                }
            }
            GlassEffectContainer {
                HStack(spacing: 24) {
                    Spacer()
                    Button("Previous", systemImage: "backward.fill", action: music.previous)
                    Button(music.isPlaying ? "Pause" : "Play", systemImage: music.isPlaying ? "pause.fill" : "play.fill", action: music.togglePlayPause)
                        .controlSize(.extraLarge)
                    Button("Next", systemImage: "forward.fill", action: music.next)
                    Spacer()
                }
                .labelStyle(.iconOnly)
                .buttonStyle(.glass)
                .font(.title2)
            }
        }
    }
}
