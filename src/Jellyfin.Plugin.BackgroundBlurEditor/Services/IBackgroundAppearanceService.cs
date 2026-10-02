using Jellyfin.Plugin.BackgroundBlurEditor.Domain;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Services;

/// <summary>Application operations for appearance reads and writes.</summary>
public interface IBackgroundAppearanceService
{
    /// <summary>Reads effective values for one viewer-visible detail item.</summary>
    ValueTask<EffectiveRead> ReadEffectiveAsync(
        UserId viewer,
        ItemId requestedItem,
        CancellationToken cancellationToken);

    /// <summary>Reads editable values for one administrator-visible detail item.</summary>
    ValueTask<EditorRead> ReadEditorAsync(ItemId requestedItem, CancellationToken cancellationToken);

    /// <summary>Reads global settings and configured titles.</summary>
    ValueTask<AdminSnapshot> ReadAdminAsync(string? search, CancellationToken cancellationToken);

    /// <summary>Saves global values using optimistic concurrency.</summary>
    ValueTask<GlobalWrite> SaveGlobalAsync(
        RevisionToken expected,
        Appearance values,
        CancellationToken cancellationToken);

    /// <summary>Saves one title override using optimistic concurrency.</summary>
    ValueTask<TitleWrite> SaveTitleAsync(
        ItemId requestedItem,
        RevisionToken expected,
        AppearanceOverride values,
        CancellationToken cancellationToken);

    /// <summary>Resets one title override using optimistic concurrency.</summary>
    ValueTask<TitleWrite> ResetTitleAsync(
        ItemId requestedItem,
        RevisionToken expected,
        CancellationToken cancellationToken);
}
