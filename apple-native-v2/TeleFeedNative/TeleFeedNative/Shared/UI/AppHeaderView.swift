import SwiftUI

struct AppHeaderView: View {
    @Bindable var store: AppStore
    
    var body: some View {
        HStack {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FolderChip(label: "All", isSelected: store.selectedFolder == "All") { store.selectedFolder = "All" }
                    FolderChip(label: "ИИ", isSelected: store.selectedFolder == "ИИ") { store.selectedFolder = "ИИ" }
                    FolderChip(label: "IL", isSelected: store.selectedFolder == "IL") { store.selectedFolder = "IL" }
                    FolderChip(label: "GM", isSelected: store.selectedFolder == "GM") { store.selectedFolder = "GM" }
                }
            }
            Spacer()
            HStack(spacing: 18) {
                Button(action: { if store.textZoom > 0.8 { store.textZoom -= 0.1 } }) { Text("-").font(.system(size: 18, weight: .medium)).foregroundColor(ColorTokens.gray) }.buttonStyle(.plain)
                Button(action: { if store.textZoom < 2.0 { store.textZoom += 0.1 } }) { Text("+").font(.system(size: 20, weight: .medium)).foregroundColor(ColorTokens.gray) }.buttonStyle(.plain)
                
                Button(action: { 
                    store.feedMode = store.feedMode == "feed" ? "saved" : "feed" 
                }) { 
                    Image(systemName: store.feedMode == "saved" ? "heart.slash.fill" : "heart.fill")
                        .font(.system(size: 14))
                        .foregroundColor(store.feedMode == "saved" ? .red : ColorTokens.gray) 
                }
                .buttonStyle(.plain)
                
                Button(action: { 
                    withAnimation { store.clearCurrentFeed() } 
                }) { 
                    Image(systemName: "eye.fill").font(.system(size: 14)).foregroundColor(ColorTokens.gray) 
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.trailing, 16)
        .padding(.leading, 80) // Pushes content to the right of red/yellow/green OSX buttons
        .padding(.top, 4) // Precise vertical match with macOS traffic lights inline
        .padding(.bottom, 14) // Keeps spacing below
        .background(ColorTokens.bg) // Header has same background as body in old app!
        .zIndex(10)
    }
}
