# Background Image Blur Editor architecture

## Problem

The plugin adds server-owned appearance settings to Jellyfin Web detail pages. The server must enforce library visibility, resolve season and episode inheritance, preserve concurrent administrator edits, and store settings without changing Jellyfin metadata. The client must coexist with Jellyfin Enhanced, Abyss Spotlight, themes, and other injected scripts.

## Usage

An authenticated client reads only the Effective Appearance for a visible item:

```text
GET /BackgroundBlurEditor/v1/effective/{itemId}
```

An administrator reads and changes the editable state:

```text
GET    /BackgroundBlurEditor/v1/admin/editor/{itemId}
GET    /BackgroundBlurEditor/v1/admin/snapshot
PUT    /BackgroundBlurEditor/v1/admin/global
PUT    /BackgroundBlurEditor/v1/admin/titles/{itemId}
DELETE /BackgroundBlurEditor/v1/admin/titles/{itemId}
```

The server resolves a season or episode to its Owning Series. The client never submits a parent ID as an authority.

## Server shape

`BackgroundAppearanceService` is the application boundary. It hides Jellyfin item resolution, per-field inheritance, administration policy, revision handling, and persistence outcomes from the controller.

```csharp
public interface IBackgroundAppearanceService
{
    ValueTask<EffectiveRead> ReadEffectiveAsync(UserId viewer, ItemId requestedItem, CancellationToken cancellationToken);
    ValueTask<EditorRead> ReadEditorAsync(UserId administrator, ItemId requestedItem, CancellationToken cancellationToken);
    ValueTask<AdminSnapshot> ReadAdminAsync(UserId administrator, string? search, CancellationToken cancellationToken);
    ValueTask<GlobalWrite> SaveGlobalAsync(UserId administrator, GlobalChange change, CancellationToken cancellationToken);
    ValueTask<TitleWrite> SaveTitleAsync(UserId administrator, ItemId requestedItem, TitleChange change, CancellationToken cancellationToken);
    ValueTask<TitleWrite> ResetTitleAsync(UserId administrator, ItemId requestedItem, RevisionToken expected, CancellationToken cancellationToken);
}
```

`JellyfinTitleDirectory` is the only module that knows Jellyfin entity classes. Viewer reads use the user-filtered `ILibraryManager.GetItemById` overload. Movie and series items own records. Season and episode items resolve through their Jellyfin `SeriesId`.

The HTTP controller parses claims and transport values, then maps closed application outcomes to status codes. Viewer responses omit title overrides and revision data. Administrator responses include the editable override and its revision.

## Persistence

`JsonAppearanceStore` owns the private JSON schema, range validation, immutable snapshots, revision checks, serialized writes, corrupt-file handling, and atomic replacement.

Global settings and each Title have independent revisions. Reset retains a tombstone with a new revision. A stale editor therefore cannot recreate a reset override by saving an old initial revision.

Each successful mutation performs these steps under one process-local gate:

1. Compare the expected record revision with the current revision.
2. Build a complete next document.
3. Write and flush a temporary file in the destination directory.
4. Atomically replace the destination.
5. Publish the in-memory snapshot.

A corrupt file is copied to a diagnostic backup and places the store in a failed state. The plugin does not silently replace administrator settings with defaults.

## Web loading

`WebShellInjectionStartupFilter` wraps only `GET` requests for the Jellyfin Web shell. It removes compression and range request headers, captures the complete downstream response, and inserts one marked script tag before `</body>`. It preserves all existing HTML and injected scripts.

The response wrapper captures both stream writes and `SendFileAsync`. Rewritten responses receive the correct content length and lose validators that described the original bytes. Failures return the untouched downstream response or propagate the original server exception.

The plugin serves allowlisted embedded assets from `/BackgroundBlurEditor/v1/assets/{name}`. It does not edit Jellyfin's `index.html` and does not depend on another injection plugin.

## Browser shape

The vanilla TypeScript bundle contains these modules:

| Module | Responsibility |
| --- | --- |
| `api.ts` | Authenticated Jellyfin API calls and runtime response validation |
| `navigation.ts` | Detail-route discovery, cancellation, and cleanup |
| `appearance.ts` | Typed appearance values, inheritance, and range validation |
| `style.ts` | Scoped CSS variables, Panel Glass paint, feature detection, and cleanup |
| `itemAction.ts` | One administrator action in Jellyfin's action sheet |
| `editor.ts` | Live preview, save, cancel, reset, and conflict reload |
| `loader.ts` | Idempotent browser-session lifecycle |
| `admin.ts` | Global settings and Configured Title management |

The loader stores one namespaced disposal callback on `window`. Reloading the script disposes the previous observers, listeners, dialogs, and style state before mounting a new client.

Every detail-page session has an `AbortController`. Navigation aborts stale requests and removes only `bibe-*` classes, attributes, variables, and elements.

Runtime wire validators reject malformed responses before values reach CSS. Panel Glass changes background paint and `backdrop-filter`; it never sets `opacity` or `filter` on panel contents.

## Synthesis decision

Candidate 1 is the base because its store API, tombstone revisions, injection lifecycle, and verification plan were the most complete. The design adopts Candidate 2's separate public and administrator documents plus its runtime TypeScript validation. It rejects Candidate 2's callback-shaped ledger because the callback exposes persistence sequencing without adding capability.

The public server interface stays small. Controllers call one application operation, and browser modules call one API adapter. Storage DTOs, Jellyfin entities, wire DTOs, and DOM selectors remain private to their boundaries.

## Tradeoffs

- The plugin accepts a Jellyfin 10.11-specific DOM adapter in exchange for narrow CSS ownership.
- The store retains reset tombstones in exchange for correct stale-editor conflicts.
- Other clients see saved changes on their next detail navigation or refresh instead of through a new push protocol.
- Request-time shell transformation uses an undocumented Jellyfin integration seam, but it avoids disk modification and a dependency on another plugin.
