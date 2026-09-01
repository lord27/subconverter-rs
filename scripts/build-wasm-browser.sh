#!/bin/bash
set -e

# Builds the BROWSER edition of the subconverter WASM core (wasm-pack --target web)
# and installs it into www/vendor/subconverter-wasm-browser (used by pure static
# export builds, where the WASM runs in the browser).
#
# The browser edition must be packed with the BROWSER KV binding
# (www/scripts/browser-kv-bindings.js — ESM, localStorage-only, no Node deps),
# NOT the server edition (js/kv_bindings.js — CommonJS with Vercel KV / Netlify
# Blobs / SQLite). This script temporarily swaps them for the pack and restores
# the server file afterwards.
#
# Usage:
#   ./scripts/build-wasm-browser.sh             # dev build (fast)
#   ./scripts/build-wasm-browser.sh --release   # release build
#
# After running, also re-run `pnpm install` in www/ if node_modules is present
# (the script syncs the pnpm .pnpm file:-dependency snapshot itself, but a fresh
# `pnpm install` is the safest way to refresh it).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SRC=js/kv_bindings.js
BROWSER_SRC=www/scripts/browser-kv-bindings.js
DEST=www/vendor/subconverter-wasm-browser
PKG_DIR=pkg-browser
FILES="libsubconverter.js libsubconverter_bg.wasm libsubconverter.d.ts libsubconverter_bg.wasm.d.ts"

RELEASE=false
if [ "$1" = "--release" ]; then
  RELEASE=true
fi

if ! command -v wasm-pack &> /dev/null; then
  echo "wasm-pack not found. Please install it (https://rustwasm.github.io/wasm-pack/)."
  exit 1
fi

if [ ! -f "$BROWSER_SRC" ]; then
  echo "Browser KV binding not found at $BROWSER_SRC"
  exit 1
fi

# Swap in the browser edition for packing, restore the server edition on exit.
cp "$SRC" /tmp/kv_bindings.server.js
restore() {
  cp /tmp/kv_bindings.server.js "$SRC"
  rm -f /tmp/kv_bindings.server.js
}
trap restore EXIT
cp "$BROWSER_SRC" "$SRC"

echo "Building browser WASM ($([ "$RELEASE" = true ] && echo release || echo dev))..."
if [ "$RELEASE" = true ]; then
  wasm-pack build --release --target web --out-dir "$PKG_DIR"
else
  wasm-pack build --dev --target web --out-dir "$PKG_DIR"
fi

mkdir -p "$DEST"
for f in $FILES; do
  cp -f "$PKG_DIR/$f" "$DEST/$f"
done
rm -rf "$DEST/snippets"
cp -r "$PKG_DIR/snippets" "$DEST/snippets"

restore
trap - EXIT
echo "Browser WASM installed into $DEST"

# Refresh the pnpm .pnpm snapshot (file: dependency) so a running
# node_modules sees the new files even before the next `pnpm install`.
for dir in www/node_modules/.pnpm/subconverter-wasm-browser@file+*/node_modules/subconverter-wasm-browser; do
  if [ -d "$dir" ]; then
    for f in $FILES; do
      cp -f "$DEST/$f" "$dir/$f"
    done
    rm -rf "$dir/snippets"
    cp -r "$DEST/snippets" "$dir/snippets"
    echo "Synced $dir"
  fi
done

echo "Done."
