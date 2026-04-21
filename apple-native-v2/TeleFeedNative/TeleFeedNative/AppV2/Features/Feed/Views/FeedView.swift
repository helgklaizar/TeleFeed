import SwiftUI
import TeleFeedCore

public struct FeedView: View {
    @Bindable var viewModel: FeedViewModel
    @AppStorage("textZoom") private var textZoom: Double = 1.0
    
    public init(viewModel: FeedViewModel) { self.viewModel = viewModel }
    
    public var body: some View {
        ZStack(alignment: .top) {
            ColorTokens.background.ignoresSafeArea()
            let displayArray = viewModel.feedMode == "saved" ? viewModel.savedFeed : filteredFeed()
            
            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 8) {
                    Color.clear.frame(height: 80)
                    if displayArray.isEmpty { Text("Caught up!").foregroundColor(ColorTokens.textMuted).padding(.top, 100) }
                    else {
                        ForEach(displayArray) { message in
                            FeedCardView(message: message, chatTitle: viewModel.chats[message.chatId], avatarData: viewModel.avatars[message.chatId]?.data, textZoom: textZoom, onRemove: { withAnimation { viewModel.markAsReadAndRemove(message: message) } }, onFavorite: { withAnimation { viewModel.toggleFavorite(message: message) } })
                        }
                    }
                }.padding(.bottom, 20).padding(.horizontal, 12)
            }.ignoresSafeArea(edges: .top)
            
            VisualEffectView(material: .sidebar, blendingMode: .withinWindow).frame(height: 80).overlay(headerContent().padding(.top, 28)).ignoresSafeArea(edges: .top)
        }
    }
    
    private func filteredFeed() -> [TDMessage] {
        return viewModel.feed.filter { msg in
            let t = (viewModel.chats[msg.chatId] ?? "").lowercased()
            let isAi = t.contains("ai") || t.contains("ии") || t.contains("gpt") || t.contains("нейро") || t.contains("apple") || t.contains("tech")
            let isGm = t.contains("playstation") || t.contains("game") || t.contains("игров") || t.contains("nintendo") || t.contains("steam") || t.contains("xbox")
            let isIl = t.contains("israel") || t.contains("израиль") || t.contains("il") || t.contains("телавив")
            if viewModel.selectedFolder == "ИИ" { return isAi }
            if viewModel.selectedFolder == "GM" { return isGm }
            if viewModel.selectedFolder == "IL" { return isIl }
            return !isAi && !isGm && !isIl
        }
    }
    
    private func headerContent() -> some View {
        HStack {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FolderChip(label: "All", isSelected: viewModel.selectedFolder == "All") { viewModel.selectedFolder = "All" }
                    FolderChip(label: "ИИ", isSelected: viewModel.selectedFolder == "ИИ") { viewModel.selectedFolder = "ИИ" }
                    FolderChip(label: "IL", isSelected: viewModel.selectedFolder == "IL") { viewModel.selectedFolder = "IL" }
                    FolderChip(label: "GM", isSelected: viewModel.selectedFolder == "GM") { viewModel.selectedFolder = "GM" }
                }
            }
            Spacer()
            HStack(spacing: 18) {
                Button(action: { if textZoom > 0.8 { textZoom -= 0.1 } }) { Text("-").font(.system(size: 18, weight: .medium)).foregroundColor(ColorTokens.textMuted) }.buttonStyle(.plain)
                Button(action: { if textZoom < 2.0 { textZoom += 0.1 } }) { Text("+").font(.system(size: 20, weight: .medium)).foregroundColor(ColorTokens.textMuted) }.buttonStyle(.plain)
                Button(action: { viewModel.feedMode = viewModel.feedMode == "feed" ? "saved" : "feed" }) { Image(systemName: viewModel.feedMode == "saved" ? "heart.slash.fill" : "heart.fill").foregroundColor(viewModel.feedMode == "saved" ? .red : ColorTokens.textMuted) }.buttonStyle(.plain)
                Button(action: { withAnimation { if viewModel.feedMode == "feed" { viewModel.feed.removeAll() } else { viewModel.savedFeed.removeAll() } } }) { Image(systemName: "eye.fill").foregroundColor(ColorTokens.textMuted) }.buttonStyle(.plain)
            }
        }.padding(.trailing, 16).padding(.leading, 80)
    }
}
fileprivate struct FolderChip: View {
    let label: String; let isSelected: Bool; let action: () -> Void
    var body: some View { Button(action: action) { Text(label).font(.system(size: 13, weight: .regular)).padding(.horizontal, isSelected ? 16 : 8).padding(.vertical, 4).background(isSelected ? Color.white.opacity(0.15) : Color.clear).foregroundColor(isSelected ? .white : ColorTokens.textMuted).clipShape(Capsule()) }.buttonStyle(.plain) }
}
    
