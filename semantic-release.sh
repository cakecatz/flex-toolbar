#!/bin/sh

echo "Downloading latest Atom release on the stable channel..."
curl -s -L "https://atom.io/download/deb?channel=stable" \
  -H 'Accept: application/octet-stream' \
  -o "atom-amd64.deb"
dpkg-deb -x atom-amd64.deb "${HOME}/atom"
export APM_SCRIPT_PATH="${HOME}/atom/usr/bin"
export PATH="${APM_SCRIPT_PATH}:${PATH}"

echo "Using APM version:"
apm --version
echo "Using Node version:"
node --version
echo "Using NPM version:"
npm --version

echo "Installing dependencies..."
npm install

echo "Running semantic-release..."
npm run semantic-release
