#!/usr/bin/env bash
# release.sh: run the quality gate and build the zip for a GitHub release.
#
# Usage:  ./release.sh
# Output: dist/numpad-unit-movement-vX.Y.Z.zip  (X.Y.Z read from the modinfo <Version>), with
#         numpad-unit-movement/ as the zip root so the modinfo sits one folder down, as the game's Mods
#         directory expects.

set -euo pipefail
cd "$(dirname "$0")"

MOD_ID="numpad-unit-movement"
DIST_DIR="dist"

VERSION="$(grep -oE '<Version>[^<]+</Version>' "$MOD_ID.modinfo" | head -1 | sed -E 's|</?Version>||g')"
[ -n "$VERSION" ] || { echo "error: could not parse <Version> from modinfo"; exit 1; }
grep -q "^## \[$VERSION\]" CHANGELOG.md || { echo "error: CHANGELOG.md has no entry for $VERSION"; exit 1; }

if [ "${SKIP_VERIFY:-0}" != "1" ]; then
    npm run release:gate || { echo "release: 'npm run release:gate' FAILED; aborting."; exit 1; }
fi

ZIP_NAME="$MOD_ID-v${VERSION}.zip"
TARGET_DIR="$DIST_DIR/$MOD_ID"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

echo "==> Cleaning $DIST_DIR/"
rm -rf "$DIST_DIR"
mkdir -p "$TARGET_DIR"

echo "==> Mirroring the shipped files into $TARGET_DIR/"
rsync -a --exclude='.git' --exclude='.gitignore' --exclude='.DS_Store' --exclude='dist' --exclude='node_modules' \
    --exclude='release.sh' --exclude='docs' --exclude='devtools' --exclude='tests' --exclude='package.json' \
    --exclude='package-lock.json' --exclude='eslint.config.js' --exclude='CONTRIBUTING.md' --exclude='*.bak' \
    ./ "$TARGET_DIR"/

echo "==> Syntax-checking the shipped JS"
find "$TARGET_DIR" -name '*.js' -type f -print0 | xargs -0 -n1 node --check

echo "==> Zipping $ZIP_PATH"
( cd "$DIST_DIR" && zip -qr "$ZIP_NAME" "$MOD_ID" )

echo "==> Checking the zip against the allow-list"
ALLOW="^$MOD_ID/($MOD_ID\.modinfo|README\.md|LICENSE|CHANGELOG\.md)$"
ALLOW="$ALLOW"'|^'"$MOD_ID"'/ui/[a-z-]+\.js$'
ALLOW="$ALLOW"'|^'"$MOD_ID"'/images/[a-z-]+\.(svg|png)$'
ALLOW="$ALLOW"'|^'"$MOD_ID"'/text/[a-z_]+/ModText\.xml$'
UNEXPECTED="$(unzip -Z1 "$ZIP_PATH" | grep -vE '/$' | grep -vE "$ALLOW" || true)"
if [ -n "$UNEXPECTED" ]; then
    echo "error: zip contains entries not on the allow-list:"
    echo "$UNEXPECTED" | sed 's/^/    /'
    exit 1
fi
unzip -l "$ZIP_PATH"

echo "==> Logo and screenshot zips for the GitHub release"
rm -rf "$DIST_DIR/$MOD_ID-logos" "$DIST_DIR/$MOD_ID-screenshots"
mkdir -p "$DIST_DIR/$MOD_ID-logos" "$DIST_DIR/$MOD_ID-screenshots"
cp docs/workshop-preview.png docs/workshop-preview.svg images/$MOD_ID-icon.png images/$MOD_ID-icon.svg "$DIST_DIR/$MOD_ID-logos/"
cp docs/screenshots/*.jpg "$DIST_DIR/$MOD_ID-screenshots/"
( cd "$DIST_DIR" && zip -qr "$MOD_ID-v${VERSION}-logos.zip" "$MOD_ID-logos" && zip -qr "$MOD_ID-v${VERSION}-screenshots.zip" "$MOD_ID-screenshots" )
echo "release: $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1)), plus -logos.zip and -screenshots.zip"
