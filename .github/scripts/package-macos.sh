#!/usr/bin/env bash
# Ad hoc signing seals the complete bundle without requiring an Apple Developer account.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <app-path> <dmg-path>" >&2
  exit 2
fi

app=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
output=$(mkdir -p "$(dirname "$2")" && cd "$(dirname "$2")" && pwd)/$(basename "$2")
name=$(basename "$app" .app)
stage=$(mktemp -d)
mount=$(mktemp -d)
mounted=false

cleanup() {
  if $mounted; then
    hdiutil detach "$mount" -quiet
  fi
  rm -rf "$stage" "$mount"
}
trap cleanup EXIT

verify_icon() {
  local icon
  icon=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIconFile' "$1/Contents/Info.plist")
  case "$icon" in
    *.icns) ;;
    *) icon="$icon.icns" ;;
  esac
  test -s "$1/Contents/Resources/$icon"
  test "$(head -c 4 "$1/Contents/Resources/$icon")" = "icns"
}

ditto "$app" "$stage/$name.app"
app="$stage/$name.app"
verify_icon "$app"

# Sign inner code before sealing its containing bundles. Nothing inside the app
# may be changed after this point or Gatekeeper will report a damaged bundle.
while IFS= read -r -d '' binary; do
  if file -b "$binary" | grep -q 'Mach-O'; then
    codesign --force --sign - --timestamp=none "$binary"
  fi
done < <(find "$app/Contents" -type f -print0)

while IFS= read -r -d '' bundle; do
  codesign --force --sign - --timestamp=none "$bundle"
done < <(find "$app/Contents" -depth -type d \( -name '*.framework' -o -name '*.app' -o -name '*.xpc' \) -print0)

codesign --force --sign - --timestamp=none "$app"
codesign --verify --deep --strict --verbose=2 "$app"

ln -s /Applications "$stage/Applications"
hdiutil create -ov -volname "$name" -srcfolder "$stage" -format UDZO "$output"
hdiutil verify "$output"
hdiutil attach "$output" -readonly -nobrowse -mountpoint "$mount"
mounted=true
verify_icon "$mount/$name.app"
codesign --verify --deep --strict --verbose=2 "$mount/$name.app"
