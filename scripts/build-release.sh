#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dotnet_command="${DOTNET_COMMAND:-dotnet}"
version="${1:-0.1.0}"
artifact_dir="$repo_dir/artifacts"
archive="$artifact_dir/background-blur-editor-$version.zip"
dll="$repo_dir/src/Jellyfin.Plugin.BackgroundBlurEditor/bin/Release/net9.0/Jellyfin.Plugin.BackgroundBlurEditor.dll"

cd "$repo_dir"
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web test
npm --prefix web run build
"$dotnet_command" test Jellyfin.Plugin.BackgroundBlurEditor.slnx --configuration Release
"$dotnet_command" build src/Jellyfin.Plugin.BackgroundBlurEditor/Jellyfin.Plugin.BackgroundBlurEditor.csproj --configuration Release --no-restore

mkdir -p "$artifact_dir"
rm -f "$archive"
zip -j "$archive" "$dll"
printf 'Created %s\n' "$archive"
