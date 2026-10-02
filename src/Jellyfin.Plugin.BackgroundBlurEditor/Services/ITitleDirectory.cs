using Jellyfin.Plugin.BackgroundBlurEditor.Domain;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Services;

/// <summary>Live title metadata for the administrator table.</summary>
public sealed record AdminTitle(ItemId ItemId, string TitleName, TitleKind TitleKind, bool IsMissing);

/// <summary>Resolves Jellyfin items and their appearance-owning title.</summary>
public interface ITitleDirectory
{
    /// <summary>Resolves an item only when the viewer can access it.</summary>
    ValueTask<VisibleTitle?> ResolveVisibleAsync(
        UserId viewer,
        ItemId requestedItem,
        CancellationToken cancellationToken);

    /// <summary>Resolves a supported item for an already-authorized administrator.</summary>
    ValueTask<VisibleTitle?> ResolveForAdminAsync(
        ItemId requestedItem,
        CancellationToken cancellationToken);

    /// <summary>Describes a stored owner, including missing titles.</summary>
    ValueTask<AdminTitle> DescribeStoredAsync(
        TitleStateDescriptor stored,
        CancellationToken cancellationToken);
}

/// <summary>Stored identity data used when a Jellyfin title is missing.</summary>
public sealed record TitleStateDescriptor(ItemId ItemId, string LastKnownTitle, TitleKind LastKnownKind);
