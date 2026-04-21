import SwiftUI
import TeleFeedCore

public struct FeedCardView: View {
    let message: TDMessage; let chatTitle: String?; let avatarData: String?; let textZoom: Double
    let onRemove: () -> Void; let onFavorite: () -> Void
    @State private var isRead = false; @State private var isFavorite = false
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            renderHeader()
            Divider().background(Color.white.opacity(0.05))
            VStack(alignment: .leading, spacing: 8) { renderContent() }.padding(.horizontal, 16).padding(.vertical, 12)
        }.background(ColorTokens.cardBackground).cornerRadius(12)
    }
    
    @ViewBuilder
    private func renderHeader() -> some View {
        HStack(alignment: .center, spacing: 10) {
            renderAvatar()
            VStack(alignment: .leading, spacing: 2) {
                Button(action: openTelegramPost) { Text(chatTitle ?? "Channel \(message.chatId)").font(.system(size: 15, weight: .bold)).foregroundColor(ColorTokens.textPrimary).lineLimit(1) }.buttonStyle(.plain)
                Text(Date(timeIntervalSince1970: TimeInterval(message.date)), format: .dateTime).font(.system(size: 13)).foregroundColor(ColorTokens.textMuted)
            }
            Spacer()
            HStack(spacing: 16) {
                Button(action: { isRead = true; DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { onRemove() } }) { Image(systemName: isRead ? "eye.slash.fill" : "eye.fill") }.buttonStyle(.plain).foregroundColor(isRead ? ColorTokens.brandBlue : ColorTokens.textMuted)
                Button(action: { isFavorite = true; DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { onFavorite() } }) { Image(systemName: isFavorite ? "heart.fill" : "heart") }.buttonStyle(.plain).foregroundColor(isFavorite ? .red : ColorTokens.textMuted)
            }
        }.padding(.horizontal, 16).padding(.vertical, 12).background(ColorTokens.cardHeader)
    }
    
    @ViewBuilder
    private func renderAvatar() -> some View {
        if let thumb = avatarData, let padded = thumb.paddedBase64(), let data = Data(base64Encoded: padded, options: .ignoreUnknownCharacters), let nsImage = NSImage(data: data) {
            Image(nsImage: nsImage).resizable().aspectRatio(contentMode: .fill).frame(width: 38, height: 38).clipShape(Circle()).blur(radius: 2)
        } else {
            Circle().fill(Color(hue: Double(abs(message.chatId) % 100) / 100.0, saturation: 0.6, brightness: 0.8)).frame(width: 38, height: 38).overlay(Text(chatTitle?.prefix(1).uppercased() ?? "C").foregroundColor(.white).font(.system(size: 16, weight: .semibold)))
        }
    }
    
    @ViewBuilder
    private func renderContent() -> some View {
        let baseSize = 15.0 * textZoom
        switch message.content {
        case .text(let t): Text(t.text).foregroundColor(ColorTokens.textPrimary).font(.system(size: baseSize)).textSelection(.enabled).lineSpacing(4)
        case .photo(let photo, let caption):
            renderMedia(thumbData: photo?.minithumbnail?.data, fallbackLabel: "📷 Photo")
            if let c = caption, !c.text.isEmpty { Text(c.text).foregroundColor(ColorTokens.textPrimary).font(.system(size: baseSize)).lineSpacing(4) }
        case .video(let video, let caption):
            renderMedia(thumbData: video?.minithumbnail?.data, fallbackLabel: "📹 Video")
            if let c = caption, !c.text.isEmpty { Text(c.text).foregroundColor(ColorTokens.textPrimary).font(.system(size: baseSize)).lineSpacing(4) }
        case .animation(let animation, let caption):
            renderMedia(thumbData: animation?.minithumbnail?.data, fallbackLabel: "🎞 GIF")
            if let c = caption, !c.text.isEmpty { Text(c.text).foregroundColor(ColorTokens.textPrimary).font(.system(size: baseSize)).lineSpacing(4) }
        case .webPage(let text):
            if let t = text, !t.text.isEmpty { Text(t.text).foregroundColor(ColorTokens.textPrimary).font(.system(size: baseSize)).lineSpacing(4) }
        case .fallback(let typeName, let caption):
            Text("📎 \(typeName)").font(.system(size: baseSize, weight: .semibold)).foregroundColor(ColorTokens.textMuted)
            if let c = caption, !c.text.isEmpty { Text(c.text).foregroundColor(ColorTokens.textPrimary).font(.system(size: baseSize)).lineSpacing(4) }
        }
    }
    
    @ViewBuilder
    private func renderMedia(thumbData: String?, fallbackLabel: String) -> some View {
        if let thumb = thumbData, let padded = thumb.paddedBase64(), let data = Data(base64Encoded: padded, options: .ignoreUnknownCharacters), let nsImage = NSImage(data: data) {
            Image(nsImage: nsImage).resizable().aspectRatio(contentMode: .fill).frame(maxWidth: .infinity, maxHeight: 300).clipped().cornerRadius(8).blur(radius: 10)
        } else { Text(fallbackLabel).font(.system(size: 15, weight: .semibold)).foregroundColor(ColorTokens.brandBlue) }
    }
    
    private func openTelegramPost() {
        let realChatId = String(abs(message.chatId)).dropFirst(3); let msgId = message.id >> 20
        if let url = URL(string: "tg://privatepost?channel=\(realChatId)&post=\(msgId)") ?? URL(string: "https://t.me/c/\(realChatId)/\(msgId)") { NSWorkspace.shared.open(url) }
    }
}
fileprivate extension String {
    func paddedBase64() -> String? {
        var base64 = self.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/"); let padding = base64.count % 4
        if padding > 0 { base64 += String(repeating: "=", count: 4 - padding) }
        return base64
    }
}
    
