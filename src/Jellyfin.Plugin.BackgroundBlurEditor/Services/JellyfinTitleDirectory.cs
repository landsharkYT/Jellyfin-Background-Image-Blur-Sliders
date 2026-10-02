using Jellyfin.Plugin.BackgroundBlurEditor.Domain;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Services;

/// <summary>Resolves title ownership and access through Jellyfin's library services.</summary>
public sealed class JellyfinTitleDirectory : ITitleDirectory
{
    private readonly ILibraryManager _libraryManager;
    private readonly IUserManager _userManager;

    /// <summary>Initializes a new instance of the <see cref="JellyfinTitleDirectory"/> class.</summary>
    public JellyfinTitleDirectory(ILibraryManager libraryManager, IUserManager userManager)
    {
        _libraryManager = libraryManager;
        _userManager = userManager;
    }

    /// <inheritdoc />
    public ValueTask<VisibleTitle?> ResolveVisibleAsync(
        UserId viewer,
        ItemId requestedItem,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = _userManager.GetUserById(viewer.Value);
        if (user is null)
        {
            return ValueTask.FromResult<VisibleTitle?>(null);
        }

        var item = _libraryManager.GetItemById<BaseItem>(requestedItem.Value, user);
        return ValueTask.FromResult(Resolve(item, requestedItem, id => _libraryManager.GetItemById<BaseItem>(id, user)));
    }

    /// <inheritdoc />
    public ValueTask<VisibleTitle?> ResolveForAdminAsync(
        ItemId requestedItem,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var item = _libraryManager.GetItemById<BaseItem>(requestedItem.Value);
        return ValueTask.FromResult(Resolve(item, requestedItem, id => _libraryManager.GetItemById<BaseItem>(id)));
    }

    /// <inheritdoc />
    public ValueTask<AdminTitle> DescribeStoredAsync(
        TitleStateDescriptor stored,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var item = _libraryManager.GetItemById<BaseItem>(stored.ItemId.Value);
        var result = item switch
        {
            Movie movie => new AdminTitle(stored.ItemId, movie.Name, TitleKind.Movie, false),
            Series series => new AdminTitle(stored.ItemId, series.Name, TitleKind.Series, false),
            _ => new AdminTitle(stored.ItemId, stored.LastKnownTitle, stored.LastKnownKind, true)
        };
        return ValueTask.FromResult(result);
    }

    private static VisibleTitle? Resolve(
        BaseItem? requested,
        ItemId requestedId,
        Func<Guid, BaseItem?> findOwner)
    {
        return requested switch
        {
            Movie movie => CreateDirect(requestedId, movie, TitleKind.Movie, ViewedKind.Movie),
            Series series => CreateDirect(requestedId, series, TitleKind.Series, ViewedKind.Series),
            Season season => CreateInherited(requestedId, season, season.SeriesId, ViewedKind.Season, findOwner),
            Episode episode => CreateInherited(requestedId, episode, episode.SeriesId, ViewedKind.Episode, findOwner),
            _ => null
        };
    }

    private static VisibleTitle CreateDirect(
        ItemId requestedId,
        BaseItem item,
        TitleKind titleKind,
        ViewedKind viewedKind)
    {
        return new VisibleTitle(
            requestedId,
            requestedId,
            item.Name,
            titleKind,
            viewedKind,
            item.HasImage(ImageType.Backdrop, 0));
    }

    private static VisibleTitle? CreateInherited(
        ItemId requestedId,
        BaseItem requested,
        Guid seriesId,
        ViewedKind viewedKind,
        Func<Guid, BaseItem?> findOwner)
    {
        if (seriesId == Guid.Empty || findOwner(seriesId) is not Series series)
        {
            return null;
        }

        _ = ItemId.TryCreate(seriesId, out var ownerId);
        return new VisibleTitle(
            requestedId,
            ownerId,
            series.Name,
            TitleKind.Series,
            viewedKind,
            requested.HasImage(ImageType.Backdrop, 0) || series.HasImage(ImageType.Backdrop, 0));
    }
}
