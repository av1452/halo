import MediaPlayer
import UIKit

/// What the Music app is playing, and control over it, via MediaPlayer's
/// system music player. This reflects Apple Music and the user's library;
/// it can't see other apps' playback.
@MainActor @Observable
final class MusicController {
    enum Access: Equatable { case notDetermined, denied, authorized }

    struct NowPlaying: Equatable {
        var title: String
        var artist: String
        var album: String
        var duration: TimeInterval
        var artwork: UIImage?
    }

    private(set) var access: Access
    private(set) var nowPlaying: NowPlaying?
    private(set) var isPlaying = false

    @ObservationIgnored private var player: MPMusicPlayerController?
    @ObservationIgnored private var observers: [NSObjectProtocol] = []

    init() {
        access = Self.map(MPMediaLibrary.authorizationStatus())
    }

    /// Current position, read live from the player (not observed).
    var playbackTime: TimeInterval { player?.currentPlaybackTime ?? 0 }

    func requestAccess() async {
        let status = await withCheckedContinuation { continuation in
            MPMediaLibrary.requestAuthorization { continuation.resume(returning: $0) }
        }
        access = Self.map(status)
        if access == .authorized { start() }
    }

    func start() {
        guard access == .authorized, player == nil else { return }
        let player = MPMusicPlayerController.systemMusicPlayer
        self.player = player
        player.beginGeneratingPlaybackNotifications()
        let center = NotificationCenter.default
        for name in [Notification.Name.MPMusicPlayerControllerNowPlayingItemDidChange, .MPMusicPlayerControllerPlaybackStateDidChange] {
            observers.append(center.addObserver(forName: name, object: player, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.refresh() }
            })
        }
        refresh()
    }

    func togglePlayPause() {
        guard let player else { return }
        if player.playbackState == .playing { player.pause() } else { player.play() }
    }

    func next() { player?.skipToNextItem() }

    /// Restarts the song if we're more than 3 seconds in, like the Music app.
    func previous() {
        guard let player else { return }
        if player.currentPlaybackTime > 3 { player.skipToBeginning() } else { player.skipToPreviousItem() }
    }

    func seek(to time: TimeInterval) { player?.currentPlaybackTime = time }

    private func refresh() {
        guard let player else { return }
        isPlaying = player.playbackState == .playing
        guard let item = player.nowPlayingItem else {
            nowPlaying = nil
            return
        }
        nowPlaying = NowPlaying(
            title: item.title ?? "Unknown Title",
            artist: item.artist ?? "",
            album: item.albumTitle ?? "",
            duration: item.playbackDuration,
            artwork: item.artwork?.image(at: CGSize(width: 400, height: 400))
        )
    }

    private static func map(_ status: MPMediaLibraryAuthorizationStatus) -> Access {
        switch status {
        case .authorized: .authorized
        case .notDetermined: .notDetermined
        default: .denied
        }
    }

    /// 125 → "2:05"
    nonisolated static func format(_ seconds: TimeInterval) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "0:00" }
        let total = Int(seconds)
        return "\(total / 60):" + String(format: "%02d", total % 60)
    }
}
