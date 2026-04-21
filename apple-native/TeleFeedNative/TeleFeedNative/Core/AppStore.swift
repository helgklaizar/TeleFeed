import SwiftUI
import Observation
import TeleFeedCore

@MainActor
@Observable
class AppStore {
    var connectionState: String = "Initializing..."
    var errorMessage: String? = nil
    var logs: [String] = []
    var feed: [TDMessage] = []
    var savedFeed: [TDMessage] = []
    var chats: [Int64: String] = [:]
    var avatars: [Int64: TDChatPhotoInfo] = [:]
    var localFiles: [Int: String] = [:]
    
    var selectedFolder: String = "All"
    var feedMode: String = "feed" // "feed" | "saved"
    var expandedPosts: Set<String> = []
    var activePopoverId: Int64? = nil
    var hoveredPostId: String? = nil
    
    var textZoom: Double = {
        let zoom = UserDefaults.standard.double(forKey: "textZoom")
        return zoom == 0 ? 1.0 : zoom
    }() {
        didSet { UserDefaults.standard.set(textZoom, forKey: "textZoom") }
    }
    
    let client = TDClient()
    
    init() {
        start()
    }
    
    func start() {
        Task.detached {
            await self.client.start()
            let decoder = JSONDecoder()
            
            for await updateString in await self.client.updates {
                guard let data = updateString.data(using: .utf8) else { continue }
                
                // Do parsing BEFORE blocking MainActor!
                let baseUpdate = try? decoder.decode(TDUpdate.self, from: data)
                
                // Fast path for updateFile to avoid heavy string bridging on UI thread
                if baseUpdate?.type == "updateFile" {
                    if let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let fileDict = dict["file"] as? [String: Any],
                       let fileId = fileDict["id"] as? Int,
                       let localDict = fileDict["local"] as? [String: Any],
                       let path = localDict["path"] as? String,
                       let completed = localDict["is_downloading_completed"] as? Bool,
                       completed == true,
                       !path.isEmpty {
                        await MainActor.run { self.localFiles[fileId] = path }
                    }
                    continue
                }
                
                await MainActor.run {
                    self.logs.insert(updateString, at: 0)
                    if self.logs.count > 100 { self.logs.removeLast() }
                    
                    guard let baseUpdate = baseUpdate else { return }
                    
                    do {
                        if baseUpdate.type == "updateAuthorizationState" {
                            let authUpdate = try decoder.decode(TDUpdateAuthorizationState.self, from: data)
                            self.handleAuthState(authUpdate.authorizationState)
                            self.errorMessage = nil
                        } else if baseUpdate.type == "updateNewMessage" {
                            let msgUpdate = try decoder.decode(TDUpdateNewMessage.self, from: data)
                            if msgUpdate.message.isChannelPost == true {
                                if !self.feed.contains(where: { $0.globalId == msgUpdate.message.globalId }) {
                                    self.feed.append(msgUpdate.message)
                                    self.feed.sort(by: { $0.date > $1.date })
                                }
                            }
                        } else if baseUpdate.type == "updateNewChat" {
                            let chatUpdate = try decoder.decode(TDUpdateNewChat.self, from: data)
                            if let title = chatUpdate.chat.title {
                                self.chats[chatUpdate.chat.id] = title
                            }
                            if let photoInfo = chatUpdate.chat.photo {
                                self.avatars[chatUpdate.chat.id] = photoInfo
                            }
                            if let msg = chatUpdate.chat.lastMessage, msg.isChannelPost == true {
                                if !self.feed.contains(where: { $0.globalId == msg.globalId }) {
                                    self.feed.append(msg)
                                    self.feed.sort(by: { $0.date > $1.date })
                                }
                            }
                        } else if baseUpdate.type == "updateChatTitle" {
                            if let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                               let chatId = dict["chat_id"] as? Int64,
                               let title = dict["title"] as? String {
                                self.chats[chatId] = title
                            }
                        } else if baseUpdate.type == "updateChatLastMessage" {
                            let lastMsgUpdate = try decoder.decode(TDUpdateChatLastMessage.self, from: data)
                            if let msg = lastMsgUpdate.lastMessage, msg.isChannelPost == true {
                                if !self.feed.contains(where: { $0.globalId == msg.globalId }) {
                                    self.feed.append(msg)
                                    self.feed.sort(by: { $0.date > $1.date })
                                }
                            }
                        } else if baseUpdate.type == "error" {
                            if let errorDict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                               let code = errorDict["code"] as? Int,
                               let message = errorDict["message"] as? String {
                                self.errorMessage = "Error \(code): \(message)"
                            }
                        }
                    } catch {
                        // Ignore parsing errors
                    }
                }
            }
        }
    }
    
    private func handleAuthState(_ state: TDAuthorizationState) {
        switch state {
        case .waitTdlibParameters:
            let savedApiId = UserDefaults.standard.string(forKey: "api_id") ?? ""
            let savedApiHash = UserDefaults.standard.string(forKey: "api_hash") ?? ""
            
            if !savedApiId.isEmpty && !savedApiHash.isEmpty, let apiIdInt = Int(savedApiId) {
                self.connectionState = "Configuring TDLib..."
                Task { await sendTdlibParams(apiId: apiIdInt, apiHash: savedApiHash) }
            } else {
                self.connectionState = "Awaiting API Credentials"
            }
        case .waitEncryptionKey:
            self.connectionState = "Unlocking Database..."
            Task { await sendEncryptionKey() }
        case .waitPhoneNumber:
            self.connectionState = "Awaiting Phone Number"
        case .waitCode:
            self.connectionState = "Awaiting Code"
        case .waitPassword:
            self.connectionState = "Awaiting Password"
        case .ready:
            self.connectionState = "Authorized & Ready"
            Task { await loadChats() }
        case .closed:
            self.connectionState = "Connection Closed"
        case .unknown(let t):
            self.connectionState = "Unknown: \(t)"
        }
    }
    
    private func loadChats() async {
        let request = """
        {
          "@type": "getChats",
          "chat_list": {
            "@type": "chatListMain"
          },
          "limit": 100
        }
        """
        await client.send(request: request)
    }
    func getTDLibDirPath(folder: String) -> String {
        let paths = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
        let appSupportDir = paths[0].appendingPathComponent("TeleFeedData")
        try? FileManager.default.createDirectory(at: appSupportDir, withIntermediateDirectories: true, attributes: nil)
        return appSupportDir.appendingPathComponent(folder).path
    }
    
    func sendTdlibParams(apiId: Int, apiHash: String) async {
        let dbDir = getTDLibDirPath(folder: "tdlib")
        let filesDir = getTDLibDirPath(folder: "tdlib_files")
        
        let request = """
        {
          "@type": "setTdlibParameters",
          "use_test_dc": false,
          "database_directory": "\(dbDir)",
          "files_directory": "\(filesDir)",
          "use_file_database": true,
          "use_chat_info_database": true,
          "use_message_database": true,
          "use_secret_chats": false,
          "api_id": \(apiId),
          "api_hash": "\(apiHash)",
          "system_language_code": "en",
          "device_model": "macOS",
          "system_version": "14.4",
          "application_version": "1.0"
        }
        """
        await client.send(request: request)
    }
    
    func sendEncryptionKey() async {
        let request = """
        {
          "@type": "checkDatabaseEncryptionKey",
          "encryption_key": ""
        }
        """
        await client.send(request: request)
    }
    
    func setPhoneNumber(_ phone: String) {
        let request = """
        {
          "@type": "setAuthenticationPhoneNumber",
          "phone_number": "\(phone)"
        }
        """
        Task { await client.send(request: request) }
    }
    
    func setCode(_ code: String) {
        let request = """
        {
          "@type": "checkAuthenticationCode",
          "code": "\(code)"
        }
        """
        Task { await client.send(request: request) }
    }
    
    func setPassword(_ password: String) {
        let request = """
        {
          "@type": "checkAuthenticationPassword",
          "password": "\(password)"
        }
        """
        Task { await client.send(request: request) }
    }
    
    func forwardMessageToPersonal(message: TDMessage) {
        let personalChannelIdStr = UserDefaults.standard.string(forKey: "personalChannelId") ?? ""
        guard let channelId = Int64(personalChannelIdStr), channelId != 0 else { return }
        
        let request = """
        {
          "@type": "forwardMessages",
          "chat_id": \(channelId),
          "from_chat_id": \(message.chatId),
          "message_ids": [\(message.id)],
          "options": {
            "@type": "messageSendOptions",
            "disable_notification": false
          },
          "send_copy": false,
          "remove_caption": false
        }
        """
        Task { await client.send(request: request) }
    }
    
    func downloadFile(fileId: Int) {
        if localFiles[fileId] != nil { return } // Already cached
        let request = """
        {
          "@type": "downloadFile",
          "file_id": \(fileId),
          "priority": 32,
          "offset": 0,
          "limit": 0,
          "synchronous": false
        }
        """
        Task { await client.send(request: request) }
    }
    
    private func isAd(_ msg: TDMessage) -> Bool {
        let terms = ["#реклама", "о рекламодателе", "erid:"]
        func containsAd(_ text: String) -> Bool {
            let lower = text.lowercased()
            return terms.contains(where: { lower.contains($0) })
        }
        switch msg.content {
        case .text(let t): return containsAd(t.text)
        case .photo(_, let caption):
            if let text = caption?.text { return containsAd(text) }
            return false
        default: return false
        }
    }

    func getDisplayArray() -> [TDMessage] {
        if feedMode == "saved" { return savedFeed }
        
        func hasWord(_ text: String, words: [String]) -> Bool {
            let pattern = "(?u)\\b(" + words.joined(separator: "|") + ")\\b"
            if text.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil { return true }
            return false
        }
        
        func hasSubstring(_ text: String, substrings: [String]) -> Bool {
            let lower = text.lowercased()
            return substrings.contains(where: { lower.contains($0) })
        }
        
        return feed.filter { msg in
            if isAd(msg) { return false }
            
            let t = chats[msg.chatId] ?? ""
            
            let isAi = hasSubstring(t, substrings: ["gpt", "нейро", "apple", "tech"]) || hasWord(t, words: ["ai", "ии"])
            let isGm = hasSubstring(t, substrings: ["playstation", "game", "игров", "nintendo", "steam", "xbox"]) || hasWord(t, words: ["gm"])
            let isIl = hasSubstring(t, substrings: ["israel", "израиль", "телавив", "telaviv"]) || hasWord(t, words: ["il"])
            
            if selectedFolder == "ИИ" { return isAi }
            if selectedFolder == "GM" { return isGm }
            if selectedFolder == "IL" { return isIl }
            return !isAi && !isGm && !isIl
        }
    }
    
    func clearCurrentFeed() {
        if feedMode == "saved" {
            savedFeed.removeAll()
        } else {
            let activeIds = Set(getDisplayArray().map { $0.globalId })
            feed.removeAll { activeIds.contains($0.globalId) }
        }
    }
    
    func hidePost(globalId: String) {
        if feedMode == "saved" {
            savedFeed.removeAll { $0.globalId == globalId }
        } else {
            feed.removeAll { $0.globalId == globalId }
        }
    }
    
    func toggleSavePost(_ msg: TDMessage) {
        if let idx = savedFeed.firstIndex(where: { $0.globalId == msg.globalId }) {
            savedFeed.remove(at: idx)
        } else {
            savedFeed.insert(msg, at: 0)
            savedFeed.sort(by: { $0.date > $1.date })
        }
    }
    
    func stop() {
        Task {
            await client.stop()
        }
    }
}
