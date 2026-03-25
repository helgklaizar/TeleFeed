#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_BUNDLE="$PROJECT_DIR/backend/target/release/bundle/macos/TeleFeed.app"
APP_DEST="/Applications/TeleFeed.app"

echo "📦 Building TeleFeed from $PROJECT_DIR..."
cd "$PROJECT_DIR" || exit 1

# Ensure npm/nvm available
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || true

npm run tauri build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Copying to $APP_DEST..."
    rm -rf "$APP_DEST"
    cp -R "$APP_BUNDLE" "$APP_DEST"
    echo "🚀 Launching..."
    open "$APP_DEST"
else
    echo "❌ Build failed! Relaunching old version..."
    open "$APP_DEST"
fi
