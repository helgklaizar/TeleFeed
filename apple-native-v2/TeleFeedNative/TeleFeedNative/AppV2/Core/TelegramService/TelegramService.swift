import Foundation
import TeleFeedCore

public enum TelegramEvent {
    case connectionStateChanged(TDAuthorizationState)
    case newMessage(TDMessage)
    case chatTitleUpdated(chatId: Int64, title: String)
    case chatPhotoUpdated(chatId: Int64, thumbnail: TDMinithumbnail)
    case error(code: Int, message: String)
}

public actor TelegramService {
    public static let shared = TelegramService()
    
    private let client = TDClient()
    private let decoder = JSONDecoder()
    
    public let events: AsyncStream<TelegramEvent>
    private var eventsContinuation: AsyncStream<TelegramEvent>.Continuation!
    
    private init() {
        var cont: AsyncStream<TelegramEvent>.Continuation!
        self.events = AsyncStream { continuation in
            cont = continuation
        }
        self.eventsContinuation = cont
    }
    
    public func start() async {
        await client.start()
        Task { [weak self] in
            guard let self = self else { return }
            for await updateString in await self.client.updates {
                await self.parseUpdate(updateString)
            }
        }
    }
    
    public func stop() async {
        await client.stop()
        eventsContinuation.finish()
    }
    
    public func send(request: String) async {
        await client.send(request: request)
    }
    
    private func parseUpdate(_ updateString: String) async {
        guard let data = updateString.data(using: .utf8) else { return }
        do {
            let baseUpdate = try decoder.decode(TDUpdate.self, from: data)
            switch baseUpdate.type {
            case "updateAuthorizationState":
                let authUpdate = try decoder.decode(TDUpdateAuthorizationState.self, from: data)
                eventsContinuation.yield(.connectionStateChanged(authUpdate.authorizationState))
            case "updateNewMessage":
                let msgUpdate = try decoder.decode(TDUpdateNewMessage.self, from: data)
                if msgUpdate.message.isChannelPost == true { eventsContinuation.yield(.newMessage(msgUpdate.message)) }
            case "updateNewChat":
                let chatUpdate = try decoder.decode(TDUpdateNewChat.self, from: data)
                if let title = chatUpdate.chat.title { eventsContinuation.yield(.chatTitleUpdated(chatId: chatUpdate.chat.id, title: title)) }
                if let photoThumb = chatUpdate.chat.photo?.minithumbnail { eventsContinuation.yield(.chatPhotoUpdated(chatId: chatUpdate.chat.id, thumbnail: photoThumb)) }
                if let msg = chatUpdate.chat.lastMessage, msg.isChannelPost == true { eventsContinuation.yield(.newMessage(msg)) }
            case "updateChatTitle":
                if let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let chatId = dict["chat_id"] as? Int64, let title = dict["title"] as? String {
                    eventsContinuation.yield(.chatTitleUpdated(chatId: chatId, title: title))
                }
            case "error":
                if let errorDict = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let code = errorDict["code"] as? Int, let message = errorDict["message"] as? String {
                    eventsContinuation.yield(.error(code: code, message: message))
                }
            default: break
            }
        } catch {}
    }
}
    
