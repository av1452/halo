import StoreKit
import UIKit

/// Shows an app's real App Store page inside Halo with StoreKit, falling back
/// to opening the App Store when StoreKit can't load it (e.g. in the Simulator).
@MainActor
enum StoreProductPresenter {
    static func present(appStoreID: Int) async {
        guard let presenter = topViewController() else { return await openFallback(appStoreID) }
        let controller = SKStoreProductViewController()
        do {
            try await controller.loadProduct(withParameters: [SKStoreProductParameterITunesItemIdentifier: NSNumber(value: appStoreID)])
            presenter.present(controller, animated: true)
        } catch {
            await openFallback(appStoreID)
        }
    }

    static func appStoreURL(_ id: Int) -> URL {
        URL(string: "https://apps.apple.com/app/id\(id)")!
    }

    private static func openFallback(_ id: Int) async {
        await UIApplication.shared.open(appStoreURL(id))
    }

    private static func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first { $0.activationState == .foregroundActive }
        var top = scene?.keyWindow?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        return top
    }
}
