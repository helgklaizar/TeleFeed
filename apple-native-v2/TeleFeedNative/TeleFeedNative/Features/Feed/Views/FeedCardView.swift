import SwiftUI
import TeleFeedCore

struct FeedCardView: View {
    @Bindable var store: AppStore
    let message: TDMessage
    let chatTitle: String?
    let avatarInfo: TDChatPhotoInfo?
    let onRemove: () -> Void
    let onFavorite: () -> Void
    
    @State private var showingComments = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            renderHeader()
            
            Divider().background(Color.white.opacity(0.05))
            
            // Post Body
            VStack(alignment: .leading, spacing: 8) {
                renderContent()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(ColorTokens.card)
        .cornerRadius(12)
    }
    
    @ViewBuilder
    private func renderHeader() -> some View {
        HStack(alignment: .center, spacing: 10) {
            renderAvatar()
            
            VStack(alignment: .leading, spacing: 2) {
                Button(action: openTelegramPost) {
                    Text(chatTitle ?? "Channel \(message.chatId)")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(ColorTokens.text)
                        .lineLimit(1)
                }
                .buttonStyle(.plain)
                
                Text(formatDate(message.date))
                    .font(.system(size: 13))
                    .foregroundColor(ColorTokens.gray)
            }
            
            Spacer()
            
            // Actions
            HStack(spacing: 16) {
                if let count = message.interactionInfo?.replyInfo?.replyCount, count > 0 {
                    Button(action: { showingComments.toggle() }) {
                        HStack(spacing: 4) {
                            Image(systemName: "bubble.right.fill")
                            Text("\(count)").font(.system(size: 13, weight: .bold))
                        }
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(ColorTokens.gray)
                    .popover(isPresented: $showingComments, arrowEdge: .top) {
                        VStack(spacing: 12) {
                            Text("Comments")
                                .font(.headline)
                            Text("The thread is available in Telegram.")
                                .font(.caption)
                                .foregroundColor(ColorTokens.gray)
                            Button("Open in Telegram") {
                                showingComments = false
                                openTelegramPost()
                            }
                            .padding(8)
                            .background(ColorTokens.blue)
                            .cornerRadius(6)
                            .foregroundColor(.white)
                        }
                        .padding()
                        .frame(width: 250)
                    }
                }
                
                Button(action: {
                    onRemove()
                }) { 
                    Image(systemName: "eye.slash.fill") 
                }
                .buttonStyle(.plain)
                .foregroundColor(ColorTokens.gray)
                
                Button(action: {
                    onFavorite()
                }) { 
                    Image(systemName: "heart") 
                }
                .buttonStyle(.plain)
                .foregroundColor(ColorTokens.gray)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(ColorTokens.buttonBg)
    }
    
    @ViewBuilder
    private func renderAvatar() -> some View {
        if let smallId = avatarInfo?.small?.id, let localPath = store.localFiles[smallId], let nsImage = NSImage(contentsOfFile: localPath) {
            Image(nsImage: nsImage)
                .resizable()
                .scaledToFill()
                .frame(width: 38, height: 38)
                .clipShape(Circle())
        } else if let thumb = avatarInfo?.minithumbnail?.data, let data = Data(base64Encoded: thumb.paddedBase64(), options: .ignoreUnknownCharacters), let nsImage = NSImage(data: data) {
            let _ = { if let smallId = avatarInfo?.small?.id { store.downloadFile(fileId: smallId) } }()
            
            Image(nsImage: nsImage)
                .resizable()
                .scaledToFill()
                .frame(width: 38, height: 38)
                .clipShape(Circle())
                .blur(radius: 2)
        } else {
            let _ = { if let smallId = avatarInfo?.small?.id { store.downloadFile(fileId: smallId) } }()
            let hue = Double(abs(message.chatId) % 100) / 100.0
            let initial = chatTitle?.prefix(1).uppercased() ?? String(String(message.chatId).prefix(1))
            
            Circle()
                .fill(Color(hue: hue, saturation: 0.6, brightness: 0.8))
                .frame(width: 38, height: 38)
                .overlay(
                    Text(initial)
                        .foregroundColor(.white)
                        .font(.system(size: 16, weight: .semibold))
                )
        }
    }
    
    @ViewBuilder
    private func renderContent() -> some View {
        let baseSize = 15.0 * store.textZoom
        
        switch message.content {
        case .text(let t):
            renderTextContent(t.text, baseSize: baseSize)
        case .photo(let photo, let caption):
            if let photoId = photo?.sizes?.last?.photo.id {
                let _ = store.downloadFile(fileId: photoId)
                renderMedia(thumbData: photo?.minithumbnail?.data, fileId: photoId, fallbackLabel: "📷 Photo")
            } else {
                renderMedia(thumbData: photo?.minithumbnail?.data, fileId: nil, fallbackLabel: "📷 Photo")
            }
            if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
            
        case .video(let video, let caption):
            if let videoId = video?.video?.id {
                let _ = store.downloadFile(fileId: videoId)
                renderMedia(thumbData: video?.minithumbnail?.data, fileId: videoId, fallbackLabel: "📹 Video")
            } else {
                renderMedia(thumbData: video?.minithumbnail?.data, fileId: nil, fallbackLabel: "📹 Video")
            }
            if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
            
        case .animation(let animation, let caption):
            if let animId = animation?.animation?.id {
                let _ = store.downloadFile(fileId: animId)
                renderMedia(thumbData: animation?.minithumbnail?.data, fileId: animId, fallbackLabel: "🎞 GIF")
            } else {
                renderMedia(thumbData: animation?.minithumbnail?.data, fileId: nil, fallbackLabel: "🎞 GIF")
            }
            if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
            
        case .webPage(let text):
            if let t = text, !t.text.isEmpty { renderTextContent(t.text, baseSize: baseSize) }
        case .fallback(let typeName, let caption):
            Text("📎 \(typeName)").font(.system(size: baseSize, weight: .semibold)).foregroundColor(ColorTokens.gray)
            if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
        }
    }
    
    @ViewBuilder
    private func renderTextContent(_ text: String, baseSize: Double) -> some View {
        if text.count > 400 {
            let isExpanded = store.expandedPosts.contains(message.id)
            Text(text)
                .foregroundColor(ColorTokens.text)
                .font(.system(size: baseSize))
                .textSelection(.enabled)
                .lineSpacing(4)
                .lineLimit(isExpanded ? nil : 6)
            
            Button(action: {
                withAnimation { 
                    if isExpanded { store.expandedPosts.remove(message.id) }
                    else { store.expandedPosts.insert(message.id) }
                }
            }) {
                Text(isExpanded ? "Show Less" : "Read More")
                    .font(.system(size: baseSize, weight: .semibold))
                    .foregroundColor(ColorTokens.blue)
            }
            .buttonStyle(.plain)
            .padding(.top, 2)
        } else {
            Text(text)
                .foregroundColor(ColorTokens.text)
                .font(.system(size: baseSize))
                .textSelection(.enabled)
                .lineSpacing(4)
        }
    }
    
    @ViewBuilder
    private func renderMedia(thumbData: String?, fileId: Int?, fallbackLabel: String) -> some View {
        if let fId = fileId, let localPath = store.localFiles[fId], let image = NSImage(contentsOfFile: localPath) {
            Image(nsImage: image)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: 600)
                .background(Color.black.opacity(0.2))
                .cornerRadius(8)
                .clipped()
        } else if let thumb = thumbData, let data = Data(base64Encoded: thumb.paddedBase64(), options: .ignoreUnknownCharacters), let nsImage = NSImage(data: data) {
            Image(nsImage: nsImage)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(maxWidth: .infinity, maxHeight: 300)
                .clipped()
                .cornerRadius(8)
                .blur(radius: 10)
                .clipped()
                .overlay(
                    ProgressView().tint(.white).scaleEffect(1.2)
                )
        } else {
            // Fallback text only if no photo data exists
            Text(fallbackLabel).font(.system(size: 15, weight: .semibold)).foregroundColor(ColorTokens.blue)
        }
    }
    
    private func openTelegramPost() {
        let channelParts = String(message.chatId).split(separator: "100")
        if channelParts.count == 2 {
            let publicId = channelParts[1]
            if let url = URL(string: "tg://privatepost?channel=\(publicId)&post=\(message.id / 1048576)") {
                NSWorkspace.shared.open(url)
            }
        }
    }
    
    private func formatDate(_ timestamp: Int) -> String {
        let date = Date(timeIntervalSince1970: TimeInterval(timestamp))
        let formatter = DateFormatter()
        formatter.dateFormat = "dd.MM.yyyy HH:mm"
        return formatter.string(from: date)
    }
}
