import SwiftUI

public struct AuthView: View {
    @Bindable var viewModel: AuthViewModel
    
    @State private var phoneNumber = ""
    @State private var smsCode = ""
    @State private var password = ""
    
    public init(viewModel: AuthViewModel) { self.viewModel = viewModel }
    
    public var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 50)
            Image(systemName: "paperplane.fill").font(.system(size: 60)).foregroundColor(ColorTokens.brandBlue).padding(.top, 20)
            Text("TeleFeed").font(.title).fontWeight(.medium).foregroundColor(ColorTokens.textPrimary).padding(.bottom, 2)
            
            if let err = viewModel.errorMessage {
                Text(err).font(.subheadline).foregroundColor(.red).multilineTextAlignment(.center).padding(.horizontal, 40).padding(.bottom, 10)
            } else {
                Text(viewModel.connectionState).font(.subheadline).foregroundColor(ColorTokens.textMuted).multilineTextAlignment(.center).padding(.horizontal, 40).padding(.bottom, 10)
            }
            
            if viewModel.connectionState == "Awaiting API Credentials" {
                VStack(alignment: .leading, spacing: 4) {
                    Text("API ID").font(.caption).foregroundColor(ColorTokens.brandBlue)
                    TextField("12345678", text: $phoneNumber).textFieldStyle(.plain).font(.system(size: 16)).foregroundColor(ColorTokens.textPrimary).padding(.vertical, 8).overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.brandBlue), alignment: .bottom).padding(.bottom, 12)
                    Text("API Hash").font(.caption).foregroundColor(ColorTokens.brandBlue)
                    TextField("abcdef123456...", text: $smsCode).textFieldStyle(.plain).font(.system(size: 16)).foregroundColor(ColorTokens.textPrimary).padding(.vertical, 8).overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.brandBlue), alignment: .bottom)
                }.padding(.horizontal, 40)
                Button(action: { viewModel.configureApp(apiId: phoneNumber, apiHash: smsCode) }) {
                    Text("SAVE").font(.system(size: 14, weight: .bold)).frame(maxWidth: .infinity).padding(.vertical, 12).background(ColorTokens.brandBlue).foregroundColor(.white).cornerRadius(8)
                }.buttonStyle(.plain).padding(.horizontal, 40).padding(.top, 10)
            } else if viewModel.connectionState == "Awaiting Phone Number" {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Phone Number").font(.caption).foregroundColor(ColorTokens.brandBlue)
                    TextField("+1 234 567 89 00", text: $phoneNumber).textFieldStyle(.plain).font(.system(size: 16)).foregroundColor(ColorTokens.textPrimary).padding(.vertical, 8).overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.brandBlue), alignment: .bottom)
                }.padding(.horizontal, 40)
                Button(action: { viewModel.setPhoneNumber(phoneNumber) }) {
                    Text("NEXT").font(.system(size: 14, weight: .bold)).frame(maxWidth: .infinity).padding(.vertical, 12).background(ColorTokens.brandBlue).foregroundColor(.white).cornerRadius(8)
                }.buttonStyle(.plain).padding(.horizontal, 40).padding(.top, 10)
            } else if viewModel.connectionState == "Awaiting Code" {
                 VStack(alignment: .leading, spacing: 4) {
                    Text("Code").font(.caption).foregroundColor(ColorTokens.brandBlue)
                    TextField("12345", text: $smsCode).textFieldStyle(.plain).font(.system(size: 16)).foregroundColor(ColorTokens.textPrimary).padding(.vertical, 8).overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.brandBlue), alignment: .bottom)
                }.padding(.horizontal, 40)
                Button(action: { viewModel.checkCode(smsCode) }) {
                    Text("NEXT").font(.system(size: 14, weight: .bold)).frame(maxWidth: .infinity).padding(.vertical, 12).background(ColorTokens.brandBlue).foregroundColor(.white).cornerRadius(8)
                }.buttonStyle(.plain).padding(.horizontal, 40).padding(.top, 10)
            } else if viewModel.connectionState == "Awaiting Password" {
                 VStack(alignment: .leading, spacing: 4) {
                    Text("Password").font(.caption).foregroundColor(ColorTokens.brandBlue)
                    SecureField("...", text: $password).textFieldStyle(.plain).font(.system(size: 16)).foregroundColor(ColorTokens.textPrimary).padding(.vertical, 8).overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.brandBlue), alignment: .bottom)
                }.padding(.horizontal, 40)
                Button(action: { viewModel.setPassword(password) }) {
                    Text("NEXT").font(.system(size: 14, weight: .bold)).frame(maxWidth: .infinity).padding(.vertical, 12).background(ColorTokens.brandBlue).foregroundColor(.white).cornerRadius(8)
                }.buttonStyle(.plain).padding(.horizontal, 40).padding(.top, 10)
            } else {
                ProgressView().padding().tint(ColorTokens.brandBlue)
            }
            Spacer()
        }.frame(maxWidth: .infinity, maxHeight: .infinity).background(ColorTokens.background)
    }
}
    
