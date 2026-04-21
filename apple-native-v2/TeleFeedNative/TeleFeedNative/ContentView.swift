//
//  ContentView.swift
//  TeleFeedNative
//
//  Created by k on 12/04/2026.
//

import SwiftUI
import Observation
import TeleFeedCore

import SwiftUI
import Observation

struct ContentView: View {
    @Bindable var store: AppStore
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                ColorTokens.bg.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    if !store.connectionState.contains("Ready") {
                        AuthView(store: store)
                    } else {
                        FeedListView(store: store)
                    }
                    
                    if !store.connectionState.contains("Ready") {
                        Spacer()
                    }
                }
                .ignoresSafeArea(edges: .top) // Key! Pushes the VStack ALL the way to the top hardware pixels
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(store.connectionState.contains("Ready") && !store.feed.isEmpty ? ColorTokens.bg : Color.clear)
            }
        }
        .frame(minWidth: 400, minHeight: 600)
    }
}

// MARK: - Safe Base64 Helper
extension String {
    func paddedBase64() -> String {
        var base64 = self
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        
        let remainder = base64.count % 4
        if remainder > 0 {
            base64 = base64.padding(toLength: base64.count + 4 - remainder, withPad: "=", startingAt: 0)
        }
        return base64
    }
}
