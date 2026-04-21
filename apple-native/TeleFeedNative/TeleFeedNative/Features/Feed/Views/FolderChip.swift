import SwiftUI

struct FolderChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .regular))
                .padding(.horizontal, isSelected ? 16 : 8)
                .padding(.vertical, 4)
                .background(isSelected ? Color.white.opacity(0.15) : Color.clear)
                .foregroundColor(isSelected ? .white : ColorTokens.gray)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
