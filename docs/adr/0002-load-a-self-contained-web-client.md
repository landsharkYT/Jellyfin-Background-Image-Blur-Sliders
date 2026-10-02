# Load a self-contained web client

The plugin supplies its own Jellyfin Web loader instead of requiring a separate JavaScript injection plugin. It injects the loader while serving the web response rather than editing Jellyfin's `index.html`. The loader owns only the four supported appearance properties on item-detail panels and action dialogs, preserves unrelated injected scripts and styles, and restores its changes when navigation leaves the detail page.
