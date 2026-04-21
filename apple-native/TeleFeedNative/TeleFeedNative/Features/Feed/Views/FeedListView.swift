import SwiftUI
import TeleFeedCore

struct FeedListView: View {
    @Bindable var store: AppStore
    
    var body: some View {
        VStack(spacing: 0) {
            AppHeaderView(store: store)
            
            let displayArray = store.getDisplayArray()
            
            if displayArray.isEmpty {
                VStack(spacing: 16) {
                    Spacer()
                    if store.feedMode == "saved" {
                        Text("No Saved Posts").foregroundColor(ColorTokens.gray)
                    } else {
                        Text("You're all caught up!").foregroundColor(ColorTokens.gray)
                    }
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 8) {
                        ForEach(displayArray, id: \.globalId) { message in
                            let avatarOpt = store.avatars[message.chatId]
                            FeedCardView(store: store, message: message, chatTitle: store.chats[message.chatId], avatarInfo: avatarOpt)
                        }
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 20)
                    .padding(.horizontal, 12)
                }
            }
        }
        .background(
            Button("") {
                if let hoveredId = store.hoveredPostId {
                    withAnimation {
                        store.hidePost(globalId: hoveredId)
                    }
                }
            }
            .keyboardShortcut("d", modifiers: [])
            .opacity(0)
        )
    }
}
