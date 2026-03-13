#!/bin/bash

# Arguments
APP_SRC_DIR=$1
APP_DEST_APP=$2
APP_BUNDLE_PATH=$3

# Wait a moment for the main app to close
sleep 2

echo "Starting local update from $APP_SRC_DIR..."
cd "$APP_SRC_DIR" || exit 1

echo "Building new version..."
# We assume the user uses nvm or npm from standard path. Path might need to be set since this runs from detached process.
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/v20.x*/bin:$HOME/.nvm/versions/node/v18.x*/bin
source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true

# Just in case nvm is there
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

npm run tauri build

if [ $? -eq 0 ]; then
    echo "Build successful! Replacing $APP_DEST_APP..."
    rm -rf "$APP_DEST_APP"
    cp -R "$APP_BUNDLE_PATH" "$APP_DEST_APP"
    
    echo "Restarting app..."
    open "$APP_DEST_APP"
else
    echo "Build failed! Automatically restarting old app..."
    open "$APP_DEST_APP"
fi
