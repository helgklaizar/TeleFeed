import Foundation
import TDLibC

/// Defines the core states of the Telegram client connection
public enum TDConnectionState: Sendable {
    case disconnected
    case connecting
    case waitingForParameters
    case waitingForEncryptionKey
    case waitingForPhoneNumber
    case waitingForCode
    case ready
    case closed
}

struct TDLibPointer: @unchecked Sendable {
    let raw: UnsafeMutableRawPointer
}

/// A high-level, asynchronous facade for TDLib
/// This actor ensures all interactions with the C++ TDLib instance are isolated and thread-safe.
public actor TDClient {
    private var clientPtr: UnsafeMutableRawPointer?
    private var eventLoopTask: Task<Void, Never>?
    
    private var updatesContinuation: AsyncStream<String>.Continuation?
    public let updates: AsyncStream<String>

    public init() {
        let (stream, continuation) = AsyncStream.makeStream(of: String.self)
        self.updates = stream
        self.updatesContinuation = continuation
        
        print("🔧 TDClient initialized.")
    }
    
    public func start() {
        guard eventLoopTask == nil else { return }
        
        self.clientPtr = td_json_client_create()
        print("🚀 Starting real TDLib C++ listener loop...")
        
        guard let rawPtr = self.clientPtr else { return }
        let pointer = TDLibPointer(raw: rawPtr)
        let cont = self.updatesContinuation
        
        self.eventLoopTask = Task.detached {
            await Self.runEventLoop(pointer: pointer, continuation: cont)
        }
        
        send(request: "{\"@type\": \"setLogVerbosityLevel\", \"new_verbosity_level\": 1}")
    }
    
    public func send(request: String) {
        guard let ptr = clientPtr else { return }
        request.withCString { cString in
            td_json_client_send(ptr, cString)
        }
        print("✉️ Sent: \(request)")
    }
    
    nonisolated private static func runEventLoop(pointer: TDLibPointer, continuation: AsyncStream<String>.Continuation?) async {
        let ptr = pointer.raw
        while !Task.isCancelled {
            if let result = td_json_client_receive(ptr, 1.0) {
                let eventString = String(cString: result)
                continuation?.yield(eventString)
            } else {
                try? await Task.sleep(nanoseconds: 10_000_000)
            }
        }
    }
    
    public func stop() {
        eventLoopTask?.cancel()
        eventLoopTask = nil
        
        if let ptr = clientPtr {
            td_json_client_destroy(ptr)
            clientPtr = nil
        }
        updatesContinuation?.finish()
        print("🛑 TDClient stopped.")
    }
}
