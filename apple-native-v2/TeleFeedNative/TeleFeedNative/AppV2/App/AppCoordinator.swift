import Foundation
import SwiftUI
import Observation
import TeleFeedCore

@MainActor
@Observable
public class AppCoordinator {
    public let authViewModel = AuthViewModel()
    public let feedViewModel = FeedViewModel()
    public var isReady: Bool = false
    
    public init() {}
    
    public func start() {
        Task {
            await TelegramService.shared.start()
            for await event in TelegramService.shared.events {
                if case .connectionStateChanged(let state) = event {
                    if case .ready = state {
                        self.isReady = true
                        feedViewModel.loadChats()
                    } else {
                        self.isReady = false
                    }
                }
                authViewModel.handleEvent(event)
                if isReady { feedViewModel.handleEvent(event) }
            }
        }
    }
}
    
