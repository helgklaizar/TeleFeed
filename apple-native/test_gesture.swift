import SwiftUI
import PlaygroundSupport

struct ContentView: View {
    var body: some View {
        Text("Hello [Apple](https://apple.com) World!")
            .onTapGesture {
                print("Tapped Text!")
            }
            .environment(\.openURL, OpenURLAction { url in
                print("Tapped URL:", url)
                return .handled
            })
    }
}
