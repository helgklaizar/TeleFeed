import Foundation
import Observation
import TeleFeedCore

@MainActor
@Observable
public class AuthViewModel {
    public var connectionState: String = "Initializing..."
    public var errorMessage: String? = nil
    public init() {}
    
    public func handleEvent(_ event: TelegramEvent) {
        if case .connectionStateChanged(let state) = event { handleAuthState(state) }
        else if case .error(let code, let message) = event { self.errorMessage = "Error \(code): \(message)" }
    }
    private func handleAuthState(_ state: TDAuthorizationState) {
        self.errorMessage = nil
        switch state {
        case .waitTdlibParameters:
            let savedApiId = UserDefaults.standard.string(forKey: "api_id") ?? ""
            let savedApiHash = UserDefaults.standard.string(forKey: "api_hash") ?? ""
            if !savedApiId.isEmpty && !savedApiHash.isEmpty, let apiIdInt = Int(savedApiId) {
                self.connectionState = "Configuring TDLib..."
                Task { await sendTdlibParams(apiId: apiIdInt, apiHash: savedApiHash) }
            } else { self.connectionState = "Awaiting API Credentials" }
        case .waitEncryptionKey:
            self.connectionState = "Unlocking Database..."
            Task { await TelegramService.shared.send(request: "{\"@type\": \"checkDatabaseEncryptionKey\", \"encryption_key\": \"\"}") }
        case .waitPhoneNumber: self.connectionState = "Awaiting Phone Number"
        case .waitCode: self.connectionState = "Awaiting Code"
        case .waitPassword: self.connectionState = "Awaiting Password"
        case .ready: self.connectionState = "Authorized & Ready"
        case .closed: self.connectionState = "Connection Closed"
        case .unknown(let t): self.connectionState = "Unknown: \(t)"
        }
    }
    public func configureApp(apiId: String, apiHash: String) {
        UserDefaults.standard.set(apiId, forKey: "api_id")
        UserDefaults.standard.set(apiHash, forKey: "api_hash")
        if let apiIdInt = Int(apiId) {
            self.connectionState = "Configuring TDLib..."
            Task { await sendTdlibParams(apiId: apiIdInt, apiHash: apiHash) }
        }
    }
    private func sendTdlibParams(apiId: Int, apiHash: String) async {
        let dbDir = "\(NSHomeDirectory())/Library/Application Support/TeleFeedNativeV2"
        let params = "{\"@type\": \"setTdlibParameters\", \"use_test_dc\": false, \"database_directory\": \"\(dbDir)\", \"files_directory\": \"\(dbDir)/files\", \"use_file_database\": true, \"use_chat_info_database\": true, \"use_message_database\": true, \"use_secret_chats\": true, \"api_id\": \(apiId), \"api_hash\": \"\(apiHash)\", \"system_language_code\": \"en\", \"device_model\": \"macOS Native\", \"system_version\": \"14.4\", \"application_version\": \"3.0\"}"
        await TelegramService.shared.send(request: params)
    }
    public func setPhoneNumber(_ phone: String) {
        self.connectionState = "Sending...": Task { await TelegramService.shared.send(request: "{\"@type\": \"setAuthenticationPhoneNumber\", \"phone_number\": \"\(phone)\"}") }
    }
    public func checkCode(_ code: String) {
        self.connectionState = "Sending...": Task { await TelegramService.shared.send(request: "{\"@type\": \"checkAuthenticationCode\", \"code\": \"\(code)\"}") }
    }
    public func setPassword(_ password: String) {
        self.connectionState = "Sending...": Task { await TelegramService.shared.send(request: "{\"@type\": \"checkAuthenticationPassword\", \"password\": \"\(password)\"}") }
    }
}
    
