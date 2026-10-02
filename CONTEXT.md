# Background image blur editor

This context describes title-specific appearance choices in Jellyfin detail pages.

## Language

**Title**:
A Jellyfin movie or series that directly owns an Appearance Override.
_Avoid_: Item, media

**Appearance Override**:
A saved visual treatment that replaces the global appearance for one Title.
_Avoid_: Theme, style preset

**Backdrop**:
The title artwork displayed behind the content of a Jellyfin detail page.
_Avoid_: Background, wallpaper

**Foreground Panel**:
A translucent interface region drawn over the Backdrop. Its text, icons, and controls remain sharp.
_Avoid_: Menu, overlay

**Inherited Appearance**:
The Appearance Override that a season or episode receives from its series.
_Avoid_: Default, copied appearance

**Global Appearance**:
The four appearance values used when a Title does not override them.
_Avoid_: Theme defaults, fallback style

**Effective Appearance**:
The four values produced by combining a Title's Appearance Override with the Global Appearance.
_Avoid_: Resolved style, final theme

**Panel Glass**:
The theme-aware background paint and backdrop blur applied behind a Foreground Panel's content.
_Avoid_: Panel opacity, faded panel

**Owning Series**:
The series whose Appearance Override supplies the Inherited Appearance for one of its seasons or episodes.
_Avoid_: Parent item, top-level item

**Configured Title**:
A Title that has at least one saved value in its Appearance Override.
_Avoid_: Customized item, styled media

**Missing Title**:
A Configured Title whose Jellyfin item no longer exists.
_Avoid_: Deleted override, orphan
