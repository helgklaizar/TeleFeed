import Foundation
import Observation
import TeleFeedCore

@MainActor
@Observable
public class FeedViewModel {
    public var feed: [TDMessage] = []
    public var savedFeed: [TDMessage] = []
    public var chats: [Int64: String] = [:]
    public var avatars: [Int64: TDMinithumbnail] = [:]
    
    public var selectedFolder: String = "All"
    public var feedMode: String = "feed" // "feed" | "saved"
    
    public init() {}
    
    public func handleEvent(_ event: TelegramEvent) {
        switch event {
        case .newMessage(let message):
            if !self.feed.contains(where: { $0.id == message.id }) {
                self.feed.append(message)
                self.feed.sort(by: { $0.date > $1.date })
            }
        case .chatTitleUpdated(let chatId, let title):
            self.chats[chatId] = title
        case .chatPhotoUpdated(let chatId, let thumbnail):
            self.avatars[chatId] = thumbnail
        default:
            break
        }
    }
    
    public func toggleFavorite(message: TDMessage) {
        if !savedFeed.contains(where: { $0.id == message.id }) {
            savedFeed.append(message)
            forwardMessageToPersonal(message: message)
        }
        feed.removeAll { $0.id == message.id }
    }
    
    public func markAsReadAndRemove(message: TDMessage) {
        if feedMode == "saved" { savedFeed.removeAll { $0.id == message.id } } 
        else { feed.removeAll { $0.id == message.id } }
    }
    
    public func loadChats() {
        let request = "{\"@type\": \"loadChats\", \"chat_list\": {\"@type\": \"chatListMain\"}, \"limit\": 100}"
        Task { await TelegramService.shared.send(request: request) }
    }
    
    private func forwardMessageToPersonal(message: TDMessage) {
        let personalChannelIdStr = UserDefaults.standard.string(forKey: "personalChannelId") ?? ""
        guard let channelId = Int64(personalChannelIdStr), channelId != 0 else { return }
        let request = "{\"@type\": \"forwardMessages\", \"chat_id\": \(channelId), \"from_chat_id\": \(message.chatId), \"message_ids\": [\(message.id)], \"options\": {\"@type\": \"messageSendOptions\", \"disable_notification\": false}, \"send_copy\": false, \"remove_caption\": false}"
        Task { await TelegramService.shared.send(request: request) }
    }
}
    
