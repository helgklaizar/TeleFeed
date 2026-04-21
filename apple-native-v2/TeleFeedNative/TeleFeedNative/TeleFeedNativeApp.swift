//
//  TeleFeedNativeApp.swift
//  TeleFeedNative
//
//  Created by k on 12/04/2026.
//

import SwiftUI

@main
struct TeleFeedNativeApp: App {
    
    var body: some Scene {
        WindowGroup {
            RootView() // Pointed to V2 Clean Architecture
        }
        .windowStyle(.hiddenTitleBar)
        
        #if os(macOS)
        Settings {
            SettingsView()
        }
        #endif
    }
}

struct SettingsView: View {
    @AppStorage("personalChannelId") private var personalChannelId: String = ""
    
    var body: some View {
        Form {
            VStack(alignment: .leading, spacing: 10) {
                Text("TeleFeed Settings")
                    .font(.headline)
                
                TextField("Personal Channel ID", text: $personalChannelId)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Text("Enter the numeric ID (e.g. -10012345678) where saved posts will be forwarded.")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding()
        }
        .frame(width: 400, height: 150)
    }
}
