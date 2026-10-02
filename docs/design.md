# Background Image Blur Editor design

This document defines the first release of Background Image Blur Editor. It is an implementation contract for Jellyfin Server 10.11 and Jellyfin Web.

## Product boundary

The plugin changes the Backdrop and the Foreground Panels on movie, series, season, and episode detail pages. Administrators configure the Global Appearance and title-specific Appearance Overrides. All signed-in users see the same Effective Appearance.

The first release supports Jellyfin Web clients. Native clients are out of scope. The server plugin targets the Jellyfin 10.11 ABI and .NET 9.

Only movies and series own Appearance Overrides. A season or episode uses the Inherited Appearance from its Owning Series.

## Appearance values

The Global Appearance starts with these values:

| Value | Default | Range | Step |
| --- | ---: | ---: | ---: |
| Backdrop opacity | 100% | 0 to 100% | 1% |
| Backdrop blur | 0 px | 0 to 50 px | 1 px |
| Panel Glass opacity | 70% | 0 to 100% | 1% |
| Panel Glass blur | 12 px | 0 to 50 px | 1 px |

Each field in an Appearance Override is optional. An omitted field uses its matching Global Appearance value.

Panel Glass changes only the background paint and the backdrop behind a Foreground Panel. Text, icons, buttons, and other panel content remain fully opaque and sharp. The client samples the page's base background color for the Panel Glass tint.

The client applies a 150 ms transition to opacity and blur. The client disables the transition when `prefers-reduced-motion` is `reduce`.

If the client does not support `backdrop-filter`, Panel Glass opacity still works and Panel Glass blur does not apply. The editor reports this limitation. If a Title has no Backdrop, the editor disables the Backdrop controls and Panel Glass remains available.

## Style ownership

The plugin owns only the four appearance properties on supported item-detail Foreground Panels and action dialogs. It overrides conflicting theme values for those properties. It does not change cards, buttons, navigation, settings pages, or unrelated CSS properties.

The client removes its classes, variables, and inline values when navigation leaves a supported detail page. Existing Jellyfin Enhanced and Abyss Spotlight scripts remain intact.

## Administration interface

The same administrator page is available from both locations:

- The standard plugin configuration entry under **Dashboard > Plugins**.
- A **Background Blur** entry under **Administration**.

The page contains the four Global Appearance controls, a small glass preview, and a searchable table of Configured Titles. Each table row shows the Effective Appearance and provides **Edit** and **Reset** actions. A Missing Title remains listed until an administrator removes it.

Movie and series action menus include **Edit background appearance**. Season and episode action menus include **Edit series background appearance** and name the Owning Series.

The title editor pairs each slider with a numeric input and a **Use global value** state. Changes update the open detail page immediately. **Save** persists the Appearance Override. **Cancel** restores the appearance that was active before the editor opened. **Reset title** removes all four saved values.

## Client loading and refresh behavior

The server injects the plugin's loader into the served Jellyfin Web response. The plugin does not edit Jellyfin's `index.html` and does not depend on another injection plugin.

The editing browser applies a saved change immediately. Other open clients load the new Effective Appearance on their next detail-page navigation or refresh. The first release does not broadcast changes through WebSockets.

## Authorization

Any signed-in user can read the Effective Appearance for a Title that the user can access in Jellyfin. Only administrators can read the management list or change the Global Appearance and Appearance Overrides. The server verifies library access before it returns a Title's Effective Appearance.

## Persistence and concurrency

The plugin stores Appearance Overrides in a dedicated JSON file under the plugin data directory. Each write creates a complete replacement file and atomically replaces the prior file.

Each stored revision has a revision token. The server rejects an update when the submitted token is stale. The editor then offers to reload the current values.

Appearance Overrides use Jellyfin item IDs. The plugin does not recover an override by matching a media path or a provider ID after Jellyfin recreates a Title.

The first release has no import or export interface. Administrators can back up the JSON data file.

## Packaging

The display name is `Background Image Blur Editor`. The assembly name is `Jellyfin.Plugin.BackgroundBlurEditor`, and server routes start with `/BackgroundBlurEditor`. The package slug is `background-blur-editor`.

The repository uses GPL-3.0. Releases produce a versioned ZIP for manual installation. Development includes a local deployment command. A public plugin-repository manifest is out of scope for the first release.
