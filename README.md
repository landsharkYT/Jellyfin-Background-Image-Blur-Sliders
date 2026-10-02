# Background Image Blur Editor

Background Image Blur Editor is a Jellyfin Server 10.11 plugin for tuning the visual treatment of movie and series detail pages in Jellyfin Web.

Administrators can set global values and override any combination of these values for an individual movie or series:

- Backdrop opacity
- Backdrop blur
- Foreground panel opacity
- Foreground panel blur

Seasons and episodes inherit their series settings. All users who can access a title see the same effective appearance.

## Tech stack

- .NET 9 and C# for the Jellyfin server plugin, API, authorization, and JSON persistence
- TypeScript and CSS for the Jellyfin Web integration
- esbuild for the two embedded browser bundles
- xUnit and Vitest for automated tests

The repository is self-contained. It does not live in a Jellyfin media-library directory, modify Jellyfin's `index.html`, or require another injection plugin. The server injects one idempotent loader tag into the web shell response at request time.

## Compatibility

Version 0.1 targets Jellyfin Server 10.11 and the web client bundled with it. Native Jellyfin clients are not supported.

The plugin limits its changes to detail-page backdrops, foreground panels, and the matching item action menu. It preserves existing scripts and theme filters, including installations that use Jellyfin Enhanced or Abyss Spotlight. A future Jellyfin Web DOM change or a theme that replaces the relevant elements may require a plugin update.

## Build

Requirements:

- .NET SDK 9
- Node.js 20 or newer
- npm
- `zip` for release archives

Run the complete release build:

```bash
./scripts/build-release.sh
```

The command installs locked web dependencies, type-checks and tests the TypeScript code, builds the embedded bundles, runs the .NET tests, and creates `artifacts/background-blur-editor-0.1.9.zip`.

Use `DOTNET_COMMAND=/path/to/dotnet` when the .NET 9 executable is not named `dotnet`.

## Install manually

1. Extract the release ZIP into a dedicated directory under Jellyfin's plugins directory, such as `plugins/Background Image Blur Editor`.
2. Restart Jellyfin Server.
3. Open **Dashboard > Plugins > Background Image Blur Editor** to set the global appearance.
4. Open a movie or series action menu and choose **Edit background appearance** to add an override.

For a local development server, build first and provide the exact destination directory:

```bash
JELLYFIN_PLUGIN_DIR="/path/to/jellyfin/plugins/Background Image Blur Editor" \
  ./scripts/deploy-local.sh
```

The deployment command copies the release DLL. It does not restart Jellyfin.

## Data and permissions

Only administrators can change settings or list configured titles. Signed-in users can read effective values only for titles they can already access.

Settings are stored atomically in `appearance-overrides.json` under the plugin data directory. Each global and title record has its own revision token so concurrent editors cannot silently overwrite one another. Back up that file with the rest of the Jellyfin configuration.

## Design notes

The product contract is in [docs/design.md](docs/design.md), and the module/runtime design is in [docs/architecture.md](docs/architecture.md). Architectural decisions are recorded under [docs/adr](docs/adr).

## License

GPL-3.0-only. See [LICENSE](LICENSE).
