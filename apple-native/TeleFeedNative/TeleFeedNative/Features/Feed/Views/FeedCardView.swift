import SwiftUI
import AVKit
import TeleFeedCore

struct FeedCardView: View {
    @Bindable var store: AppStore
    let message: TDMessage
    let chatTitle: String?
    let avatarInfo: TDChatPhotoInfo?
    
    @State private var inlineVideoPlaying: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            
            // SIMPLIFIED HEADER
            HStack(spacing: 10) {
                if let smallId = avatarInfo?.small?.id, let localPath = store.localFiles[smallId] {
                    AsyncLocalImageView(localPath: localPath)
                        .frame(width: 38, height: 38)
                        .clipShape(Circle())
                } else {
                    Circle().fill(ColorTokens.gray.opacity(0.3)).frame(width: 38, height: 38)
                        .onAppear { if let smallId = avatarInfo?.small?.id { store.downloadFile(fileId: smallId) } }
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(chatTitle ?? "Unknown Channel")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(ColorTokens.text)
                    Text(formatDate(message.date))
                        .font(.system(size: 13))
                        .foregroundColor(ColorTokens.gray)
                }
                Spacer()
                
                HStack(spacing: 12) {
                    Button(action: {
                        withAnimation {
                            store.toggleSavePost(message)
                        }
                    }) {
                        let isSaved = store.savedFeed.contains(where: { $0.globalId == message.globalId })
                        Image(systemName: isSaved ? "heart.fill" : "heart")
                            .font(.system(size: 14))
                            .foregroundColor(isSaved ? .red : ColorTokens.gray)
                    }
                    .buttonStyle(.plain)
                    
                    Button(action: {
                        withAnimation {
                            store.hidePost(globalId: message.globalId)
                        }
                    }) {
                        Image(systemName: "eye.slash.fill")
                            .font(.system(size: 14))
                            .foregroundColor(ColorTokens.gray)
                    }
                    .buttonStyle(.plain)
                }
                .opacity(store.hoveredPostId == message.globalId ? 1.0 : 0.0)
                .animation(.easeInOut(duration: 0.15), value: store.hoveredPostId == message.globalId)
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            
            Divider().background(Color.white.opacity(0.05))
            
            // SIMPLIFIED CONTENT
            VStack(alignment: .leading, spacing: 8) {
                let baseSize = 15.0 * store.textZoom
                
                switch message.content {
                case .text(let t):
                    renderTextContent(t.text, baseSize: baseSize)
                case .photo(let photo, let caption):
                    if let photoId = photo?.sizes?.last?.photo.id {
                        renderSimpleMedia(fileId: photoId)
                            .onAppear { store.downloadFile(fileId: photoId) }
                    }
                    if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
                case .video(let video, let caption):
                    if inlineVideoPlaying, let videoId = video?.video?.id {
                        if let localPath = store.localFiles[videoId] {
                            VideoPlayer(player: AVPlayer(url: URL(fileURLWithPath: localPath)))
                                .frame(maxWidth: .infinity, idealHeight: 400)
                                .cornerRadius(8)
                        } else {
                            renderSimpleMedia(fileId: video?.thumbnail?.file.id ?? 0)
                                .overlay(ProgressView().tint(.white).scaleEffect(1.2))
                                .onAppear { store.downloadFile(fileId: videoId) }
                        }
                    } else if let thumbId = video?.thumbnail?.file.id {
                        renderSimpleMedia(fileId: thumbId)
                            .overlay(
                                Button(action: { inlineVideoPlaying = true }) {
                                    Image(systemName: "play.circle.fill").font(.system(size: 50)).foregroundColor(.white.opacity(0.8))
                                }.buttonStyle(.plain)
                            )
                            .onAppear { store.downloadFile(fileId: thumbId) }
                    }
                    if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
                case .animation(let animation, let caption):
                    if let animId = animation?.animation?.id {
                        if let localPath = store.localFiles[animId] {
                            LoopingVideoPlayerView(localPath: localPath)
                                .frame(maxWidth: .infinity, idealHeight: 400)
                                .cornerRadius(8)
                        } else {
                            renderSimpleMedia(fileId: animation?.thumbnail?.file.id ?? 0)
                                .overlay(ProgressView().tint(.white).scaleEffect(1.2))
                                .onAppear { store.downloadFile(fileId: animId) }
                        }
                    }
                    if let c = caption, !c.text.isEmpty { renderTextContent(c.text, baseSize: baseSize) }
                default:
                    Text("📎 Attachment").font(.system(size: baseSize)).foregroundColor(ColorTokens.gray)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
        .background(ColorTokens.card)
        .cornerRadius(12)
        .onHover { hovering in
            if hovering {
                store.hoveredPostId = message.globalId
            } else {
                if store.hoveredPostId == message.globalId {
                    store.hoveredPostId = nil
                }
            }
        }
    }
    
    @ViewBuilder
    private func renderSimpleMedia(fileId: Int) -> some View {
        if let localPath = store.localFiles[fileId] {
            AsyncLocalImageView(localPath: localPath)
                .frame(maxWidth: .infinity, maxHeight: 400)
                .background(Color.black.opacity(0.2))
                .cornerRadius(8)
                .clipped()
        } else {
            Rectangle()
                .fill(Color.black.opacity(0.05))
                .frame(maxWidth: .infinity, idealHeight: 200)
                .cornerRadius(8)
        }
    }
    
    @ViewBuilder
    private func renderTextContent(_ text: String, baseSize: Double) -> some View {
        let maxChars = 1000
        let needsExpansion = text.count > maxChars
        let isExpanded = store.expandedPosts.contains(message.globalId)
        
        let rawText: String = (needsExpansion && !isExpanded)
            ? String(text.prefix(maxChars)).trimmingCharacters(in: .whitespacesAndNewlines) + " ... (читать далее)"
            : text
            
        HStack {
            Text(parseMarkdownLinks(rawText))
                .foregroundColor(ColorTokens.text)
                .font(.system(size: baseSize))
                .lineSpacing(4)
                .allowsHitTesting(true)
            
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if needsExpansion {
                withAnimation(.easeInOut(duration: 0.2)) {
                    if isExpanded { store.expandedPosts.remove(message.globalId) }
                    else { store.expandedPosts.insert(message.globalId) }
                }
            }
        }
    }
    
    private func parseMarkdownLinks(_ text: String) -> AttributedString {
        let nsString = text as NSString
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: nsString.length)) ?? []
        
        var parsedText = text
        for match in matches.reversed() {
            let urlRange = match.range
            let urlString = nsString.substring(with: urlRange)
            let mdLink = "[\(urlString)](\(urlString))"
            parsedText = (parsedText as NSString).replacingCharacters(in: urlRange, with: mdLink)
        }
        
        return (try? AttributedString(markdown: parsedText)) ?? AttributedString(text)
    }

    private func formatDate(_ timestamp: Int) -> String {
        let date = Date(timeIntervalSince1970: TimeInterval(timestamp))
        let formatter = DateFormatter()
        formatter.dateFormat = "dd.MM.yyyy HH:mm"
        return formatter.string(from: date)
    }
}

struct AsyncLocalImageView: View {
    let localPath: String
    @State private var image: NSImage?
    
    var body: some View {
        Group {
            if let img = image {
                Image(nsImage: img)
                    .resizable()
            } else {
                Color.black.opacity(0.05)
                    .task {
                        let url = URL(fileURLWithPath: localPath)
                        if let data = try? Data(contentsOf: url),
                           let loaded = NSImage(data: data) {
                            await MainActor.run { self.image = loaded }
                        }
                    }
            }
        }
    }
}

class LoopingVideoPlayerNSView: NSView {
    private let playerLayer = AVPlayerLayer()
    
    override init(frame: NSRect) {
        super.init(frame: frame)
        self.wantsLayer = true
        self.layer?.addSublayer(playerLayer)
        playerLayer.videoGravity = .resizeAspectFill
    }
    
    required init?(coder: NSCoder) { fatalError("init(coder:) not implemented") }
    
    override func layout() {
        super.layout()
        playerLayer.frame = self.bounds
    }
    
    func setup(with url: URL, looperRef: inout AVPlayerLooper?) {
        let playerItem = AVPlayerItem(url: url)
        let queuePlayer = AVQueuePlayer(playerItem: playerItem)
        queuePlayer.isMuted = true
        
        looperRef = AVPlayerLooper(player: queuePlayer, templateItem: playerItem)
        playerLayer.player = queuePlayer
        queuePlayer.play()
    }
}

struct LoopingVideoPlayerView: NSViewRepresentable {
    let localPath: String
    
    class Coordinator {
        var looper: AVPlayerLooper?
    }
    
    func makeCoordinator() -> Coordinator { Coordinator() }
    
    func makeNSView(context: Context) -> LoopingVideoPlayerNSView {
        let view = LoopingVideoPlayerNSView()
        context.coordinator.looper = nil
        view.setup(with: URL(fileURLWithPath: localPath), looperRef: &context.coordinator.looper)
        return view
    }
    
    func updateNSView(_ nsView: LoopingVideoPlayerNSView, context: Context) { }
}
