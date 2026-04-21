import SwiftUI

struct AuthView: View {
    @Bindable var store: AppStore
    @State private var phoneNumber: String = ""
    @State private var code: String = ""
    @State private var password: String = ""
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 50) // Space for titlebar
            Image(systemName: "paperplane.fill")
                .font(.system(size: 60))
                .foregroundColor(ColorTokens.blue)
                .padding(.top, 20)
            
            Text("TeleFeed")
                .font(.title)
                .fontWeight(.medium)
                .foregroundColor(ColorTokens.text)
                .padding(.bottom, 2)
            
            if let err = store.errorMessage {
                Text(err)
                    .font(.subheadline)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.bottom, 10)
            } else {
                Text(authStatusMessage(for: store.connectionState))
                    .font(.subheadline)
                    .foregroundColor(ColorTokens.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.bottom, 10)
            }
            
            if store.connectionState == "Awaiting Phone Number" {
                TextField("Phone Number (e.g. +123456789)", text: $phoneNumber)
                    .textFieldStyle(.plain)
                    .font(.system(size: 16))
                    .foregroundColor(ColorTokens.text)
                    .padding(.vertical, 8)
                    .overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.blue), alignment: .bottom)
                    .padding(.horizontal, 40)
                
                Button(action: { 
                    store.connectionState = "Sending Request..."
                    store.setPhoneNumber(phoneNumber) 
                }) {
                    Text("NEXT")
                        .font(.system(size: 14, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(phoneNumber.isEmpty ? ColorTokens.blue.opacity(0.5) : ColorTokens.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .disabled(phoneNumber.isEmpty)
                .padding(.horizontal, 40)
                .padding(.top, 10)
                
            } else if store.connectionState == "Awaiting Code" {
                SecureField("Code", text: $code)
                    .textFieldStyle(.plain)
                    .font(.system(size: 16))
                    .foregroundColor(ColorTokens.text)
                    .padding(.vertical, 8)
                    .overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.blue), alignment: .bottom)
                    .padding(.horizontal, 40)
                
                Button(action: { 
                    store.connectionState = "Sending Request..."
                    store.setCode(code) 
                }) {
                    Text("NEXT")
                        .font(.system(size: 14, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(code.isEmpty ? ColorTokens.blue.opacity(0.5) : ColorTokens.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .disabled(code.isEmpty)
                .padding(.horizontal, 40)
                .padding(.top, 10)
                
            } else if store.connectionState == "Awaiting Password" {
                SecureField("2FA Password", text: $password)
                    .textFieldStyle(.plain)
                    .font(.system(size: 16))
                    .foregroundColor(ColorTokens.text)
                    .padding(.vertical, 8)
                    .overlay(Rectangle().frame(height: 2).foregroundColor(ColorTokens.blue), alignment: .bottom)
                    .padding(.horizontal, 40)
                
                Button(action: { 
                    store.connectionState = "Sending Request..."
                    store.setPassword(password) 
                }) {
                    Text("NEXT")
                        .font(.system(size: 14, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(password.isEmpty ? ColorTokens.blue.opacity(0.5) : ColorTokens.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .disabled(password.isEmpty)
                .padding(.horizontal, 40)
                .padding(.top, 10)
            }
            Spacer()
        }
    }
    
    private func authStatusMessage(for state: String) -> String {
        switch state {
        case "Awaiting Phone Number": return "Please enter your phone number in international format."
        case "Awaiting Code": return "Please enter the code sent to your Telegram app."
        case "Awaiting Password": return "Please enter your Two-Step Verification password."
        case "Awaiting API Credentials": return "Please open Settings (Cmd+,) and put your API ID and Hash."
        default: return state
        }
    }
}
