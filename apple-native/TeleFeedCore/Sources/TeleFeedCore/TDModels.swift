import Foundation

/// Core wrapper for any incoming TDLib update
public struct TDUpdate: Decodable {
    public let type: String
    
    enum CodingKeys: String, CodingKey {
        case type = "@type"
    }
}

/// Helper to decode any unknown payload to find its @type
public struct TDTypedObject: Decodable {
    public let type: String
    
    enum CodingKeys: String, CodingKey {
        case type = "@type"
    }
}

/// Specific Update: Authorization State Update
public struct TDUpdateAuthorizationState: Decodable {
    public let authorizationState: TDAuthorizationState
    
    enum CodingKeys: String, CodingKey {
        case authorizationState = "authorization_state"
    }
}

/// Enum representing the various states of authorization
public enum TDAuthorizationState: Sendable {
    case waitTdlibParameters
    case waitEncryptionKey
    case waitPhoneNumber
    case waitCode
    case waitPassword
    case ready
    case closed
    case unknown(String)
}

public struct TDUpdateFile: Decodable, Sendable {
    public let file: TDFileLocalMeta
}

public struct TDFileLocalMeta: Decodable, Sendable {
    public let id: Int
    public let local: TDLocalFile
}

public struct TDLocalFile: Decodable, Sendable {
    public let path: String
    public let isDownloadingCompleted: Bool
    
    enum CodingKeys: String, CodingKey {
        case path
        case isDownloadingCompleted = "is_downloading_completed"
    }
}

// Custom decoding for the state since TDLib uses highly polymorphic JSON
extension TDAuthorizationState: Decodable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: TDTypedObject.CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        
        switch type {
        case "authorizationStateWaitTdlibParameters":
            self = .waitTdlibParameters
        case "authorizationStateWaitEncryptionKey":
            self = .waitEncryptionKey
        case "authorizationStateWaitPhoneNumber":
            self = .waitPhoneNumber
        case "authorizationStateWaitCode":
            self = .waitCode
        case "authorizationStateWaitPassword":
            self = .waitPassword
        case "authorizationStateReady":
            self = .ready
        case "authorizationStateClosed":
            self = .closed
        default:
            self = .unknown(type)
        }
    }
}

// MARK: - Texts & Entities
public struct TDFormattedText: Decodable, Sendable, Hashable {
    public let text: String
}

public struct TDMinithumbnail: Decodable, Sendable, Hashable {
    public let width: Int
    public let height: Int
    public let data: String // base64 jpeg
}

public struct TDFile: Decodable, Sendable, Hashable {
    public let id: Int
}

public struct TDPhotoSize: Decodable, Sendable, Hashable {
    public let type: String
    public let photo: TDFile
}

public struct TDPhoto: Decodable, Sendable, Hashable {
    public let minithumbnail: TDMinithumbnail?
    public let sizes: [TDPhotoSize]?
}

public struct TDThumbnail: Decodable, Sendable, Hashable {
    public let file: TDFile
}

public struct TDVideo: Decodable, Sendable, Hashable {
    public let minithumbnail: TDMinithumbnail?
    public let thumbnail: TDThumbnail?
    public let video: TDFile?
}

public struct TDAnimation: Decodable, Sendable, Hashable {
    public let minithumbnail: TDMinithumbnail?
    public let thumbnail: TDThumbnail?
    public let animation: TDFile?
}

// MARK: - Messages & Content
public enum TDMessageContent: Decodable, Sendable, Hashable {
    case text(text: TDFormattedText)
    case photo(photo: TDPhoto?, caption: TDFormattedText?)
    case video(video: TDVideo?, caption: TDFormattedText?)
    case animation(animation: TDAnimation?, caption: TDFormattedText?)
    case webPage(text: TDFormattedText?)
    case fallback(typeName: String, caption: TDFormattedText?)
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: TDTypedObject.CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        let map = try? decoder.singleValueContainer().decode([String: AnyValue].self)
        
        switch type {
        case "messageText":
            let textParam = try decoder.singleValueContainer().decode(MessageTextPayload.self)
            self = .text(text: textParam.text)
        case "messagePhoto":
            let p = try decoder.singleValueContainer().decode(MediaPhotoPayload.self)
            self = .photo(photo: p.photo, caption: p.caption)
        case "messageVideo":
            let p = try decoder.singleValueContainer().decode(MediaVideoPayload.self)
            self = .video(video: p.video, caption: p.caption)
        case "messageAnimation":
            let p = try decoder.singleValueContainer().decode(MediaAnimationPayload.self)
            self = .animation(animation: p.animation, caption: p.caption)
        case "messageWebPage":
            let p = try decoder.singleValueContainer().decode(MessageTextPayload.self)
            self = .webPage(text: p.text)
        default:
            // For stickers, documents, audio, etc.
            if let map = map, let cDict = map["caption"]?.value as? [String: Any], let captionText = cDict["text"] as? String {
                self = .fallback(typeName: type, caption: TDFormattedText(text: captionText))
            } else {
                self = .fallback(typeName: type, caption: nil)
            }
        }
    }
}

public struct TDMessageReplyInfo: Decodable, Sendable, Hashable {
    public let replyCount: Int
    
    enum CodingKeys: String, CodingKey {
        case replyCount = "reply_count"
    }
}

public struct TDMessageInteractionInfo: Decodable, Sendable, Hashable {
    public let viewCount: Int?
    public let replyInfo: TDMessageReplyInfo?
    
    enum CodingKeys: String, CodingKey {
        case viewCount = "view_count"
        case replyInfo = "reply_info"
    }
}

public struct TDMessage: Decodable, Sendable, Identifiable, Hashable {
    public let id: Int64
    public let chatId: Int64
    public let date: Int
    public let content: TDMessageContent
    
    public var globalId: String { "\(chatId)_\(id)" }
    public let isChannelPost: Bool?
    public let interactionInfo: TDMessageInteractionInfo?
    
    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case date
        case content
        case isChannelPost = "is_channel_post"
        case interactionInfo = "interaction_info"
    }
}

public struct TDUpdateNewMessage: Decodable, Sendable {
    public let message: TDMessage
}

public struct TDUpdateChatLastMessage: Decodable, Sendable {
    public let chatId: Int64
    public let lastMessage: TDMessage?
    
    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case lastMessage = "last_message"
    }
}

public struct TDChatPhotoInfo: Decodable, Sendable {
    public let minithumbnail: TDMinithumbnail?
    public let small: TDFile?
}

public struct TDChat: Decodable, Sendable {
    public let id: Int64
    public let title: String?
    public let photo: TDChatPhotoInfo?
    public let lastMessage: TDMessage?
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case photo
        case lastMessage = "last_message"
    }
}

public struct TDUpdateNewChat: Decodable, Sendable {
    public let chat: TDChat
}

// MARK: - Helpers
private struct MessageTextPayload: Decodable { let text: TDFormattedText }
private struct MediaPhotoPayload: Decodable { 
    let photo: TDPhoto?
    let caption: TDFormattedText? 
}
private struct MediaVideoPayload: Decodable { 
    let video: TDVideo?
    let caption: TDFormattedText? 
}
private struct MediaAnimationPayload: Decodable { 
    let animation: TDAnimation?
    let caption: TDFormattedText? 
}

struct AnyValue: Decodable {
    let value: Any
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let v = try? container.decode(String.self) { value = v }
        else if let v = try? container.decode(Int.self) { value = v }
        else if let v = try? container.decode(Double.self) { value = v }
        else if let v = try? container.decode(Bool.self) { value = v }
        else if let v = try? container.decode([String: AnyValue].self) {
            value = v.mapValues { $0.value }
        }
        else if let v = try? container.decode([AnyValue].self) {
            value = v.map { $0.value }
        } else {
            value = NSNull()
        }
    }
}
