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
                        ForEach(displayArray, id: \.id) { message in
                            let avatarOpt = store.avatars[message.chatId]
                            FeedCardView(store: store, message: message, chatTitle: store.chats[message.chatId], avatarInfo: avatarOpt) {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    if store.feedMode == "saved" {
                                        store.savedFeed.removeAll { $0.id == message.id }
                                    } else {
                                        store.feed.removeAll { $0.id == message.id }
                                    }
                                }
                            } onFavorite: {
                                withAnimation {
                                    if !store.savedFeed.contains(where: { $0.id == message.id }) {
                                        store.savedFeed.append(message)
                                        store.forwardMessageToPersonal(message: message) // Natively Forward
                                    }
                                    store.feed.removeAll { $0.id == message.id }
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 20)
                    .padding(.horizontal, 12) // Outer padding for the cards!
                }
            }
        }
    }
}
