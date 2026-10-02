#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_dir="${JELLYFIN_PLUGIN_DIR:?Set JELLYFIN_PLUGIN_DIR to the dedicated plugin destination directory.}"
dll="$repo_dir/src/Jellyfin.Plugin.BackgroundBlurEditor/bin/Release/net9.0/Jellyfin.Plugin.BackgroundBlurEditor.dll"

if [[ ! -f "$dll" ]]; then
  printf 'Release DLL not found. Run ./scripts/build-release.sh first.\n' >&2
  exit 1
fi

mkdir -p "$target_dir"
cp "$dll" "$target_dir/Jellyfin.Plugin.BackgroundBlurEditor.dll"
printf 'Deployed plugin DLL to %s\n' "$target_dir"
printf 'Restart Jellyfin Server to load the new build.\n'
