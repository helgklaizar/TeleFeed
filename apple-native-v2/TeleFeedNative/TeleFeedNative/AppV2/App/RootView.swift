import SwiftUI

public struct RootView: View {
    @State private var coordinator = AppCoordinator()
    public init() {}
    
    public var body: some View {
        ZStack {
            if coordinator.isReady {
                FeedView(viewModel: coordinator.feedViewModel)
                    .transition(.opacity.animation(.easeInOut(duration: 0.3)))
            } else {
                AuthView(viewModel: coordinator.authViewModel)
                    .transition(.opacity.animation(.easeInOut(duration: 0.3)))
            }
        }
        .onAppear {
            coordinator.start()
        }
    }
}
    
