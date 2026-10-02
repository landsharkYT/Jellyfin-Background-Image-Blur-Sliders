using Jellyfin.Plugin.BackgroundBlurEditor.Domain;
using Jellyfin.Plugin.BackgroundBlurEditor.Storage;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Services;

/// <summary>Coordinates title resolution, inheritance, and revisioned storage.</summary>
public sealed class BackgroundAppearanceService : IBackgroundAppearanceService
{
    private static readonly AppearanceOverride EmptyOverride = new(null, null, null, null);
    private readonly IAppearanceStore _store;
    private readonly ITitleDirectory _titles;

    /// <summary>Initializes a new instance of the <see cref="BackgroundAppearanceService"/> class.</summary>
    public BackgroundAppearanceService(IAppearanceStore store, ITitleDirectory titles)
    {
        _store = store;
        _titles = titles;
    }

    /// <inheritdoc />
    public async ValueTask<EffectiveRead> ReadEffectiveAsync(
        UserId viewer,
        ItemId requestedItem,
        CancellationToken cancellationToken)
    {
        var title = await _titles.ResolveVisibleAsync(viewer, requestedItem, cancellationToken).ConfigureAwait(false);
        if (title is null)
        {
            return new EffectiveRead.NotVisible();
        }

        var snapshot = await _store.ReadAsync(cancellationToken).ConfigureAwait(false);
        var values = GetOverride(snapshot, title.OwnerItemId);
        return new EffectiveRead.Found(new EffectiveAppearance(
            title.RequestedItemId,
            title.OwnerItemId,
            title.TitleName,
            title.OwnerKind,
            title.ViewedKind,
            title.HasBackdrop,
            values.BackdropBlur is null,
            AppearanceResolver.Merge(snapshot.Global.Values, values)));
    }

    /// <inheritdoc />
    public async ValueTask<EditorRead> ReadEditorAsync(ItemId requestedItem, CancellationToken cancellationToken)
    {
        var title = await _titles.ResolveForAdminAsync(requestedItem, cancellationToken).ConfigureAwait(false);
        if (title is null)
        {
            return new EditorRead.NotFound();
        }

        var snapshot = await _store.ReadAsync(cancellationToken).ConfigureAwait(false);
        return new EditorRead.Found(CreateEditable(snapshot, title));
    }

    /// <inheritdoc />
    public async ValueTask<AdminSnapshot> ReadAdminAsync(string? search, CancellationToken cancellationToken)
    {
        var snapshot = await _store.ReadAsync(cancellationToken).ConfigureAwait(false);
        var rows = new List<ConfiguredTitle>();
        foreach (var state in snapshot.Titles.Values.Where(value => value.IsConfigured))
        {
            var live = await _titles.DescribeStoredAsync(
                new TitleStateDescriptor(state.ItemId, state.LastKnownTitle, state.LastKnownKind),
                cancellationToken).ConfigureAwait(false);
            if (!string.IsNullOrWhiteSpace(search)
                && !live.TitleName.Contains(search, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var values = state.Override ?? EmptyOverride;
            rows.Add(new ConfiguredTitle(
                state.ItemId,
                live.TitleName,
                live.IsMissing ? null : live.TitleKind,
                live.IsMissing,
                values,
                AppearanceResolver.Merge(snapshot.Global.Values, values),
                state.Revision));
        }

        rows.Sort((left, right) => string.Compare(left.TitleName, right.TitleName, StringComparison.OrdinalIgnoreCase));
        return new AdminSnapshot(
            new GlobalAppearance(snapshot.Global.Values, snapshot.Global.Revision),
            rows);
    }

    /// <inheritdoc />
    public async ValueTask<GlobalWrite> SaveGlobalAsync(
        RevisionToken expected,
        Appearance values,
        CancellationToken cancellationToken)
    {
        var result = await _store.TrySaveGlobalAsync(expected, values, cancellationToken).ConfigureAwait(false);
        return result switch
        {
            StoreMutation<GlobalState>.Applied applied =>
                new GlobalWrite.Applied(new GlobalAppearance(applied.Value.Values, applied.Value.Revision)),
            StoreMutation<GlobalState>.Conflict conflict =>
                new GlobalWrite.Conflict(new GlobalAppearance(conflict.Current.Values, conflict.Current.Revision)),
            _ => throw new InvalidOperationException("Unknown global store outcome.")
        };
    }

    /// <inheritdoc />
    public async ValueTask<TitleWrite> SaveTitleAsync(
        ItemId requestedItem,
        RevisionToken expected,
        AppearanceOverride values,
        CancellationToken cancellationToken)
    {
        return await MutateTitleAsync(requestedItem, expected, values, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async ValueTask<TitleWrite> ResetTitleAsync(
        ItemId requestedItem,
        RevisionToken expected,
        CancellationToken cancellationToken)
    {
        var title = await _titles.ResolveForAdminAsync(requestedItem, cancellationToken).ConfigureAwait(false);
        if (title is not null)
        {
            return await MutateResolvedTitleAsync(title, expected, null, cancellationToken).ConfigureAwait(false);
        }

        var snapshot = await _store.ReadAsync(cancellationToken).ConfigureAwait(false);
        if (!snapshot.Titles.TryGetValue(requestedItem, out var stored))
        {
            return new TitleWrite.NotFound();
        }

        var missing = new VisibleTitle(
            requestedItem,
            requestedItem,
            stored.LastKnownTitle,
            stored.LastKnownKind,
            stored.LastKnownKind == TitleKind.Movie ? ViewedKind.Movie : ViewedKind.Series,
            false);
        return await MutateResolvedTitleAsync(missing, expected, null, cancellationToken).ConfigureAwait(false);
    }

    private async ValueTask<TitleWrite> MutateTitleAsync(
        ItemId requestedItem,
        RevisionToken expected,
        AppearanceOverride? values,
        CancellationToken cancellationToken)
    {
        var title = await _titles.ResolveForAdminAsync(requestedItem, cancellationToken).ConfigureAwait(false);
        if (title is null)
        {
            return new TitleWrite.NotFound();
        }

        return await MutateResolvedTitleAsync(title, expected, values, cancellationToken).ConfigureAwait(false);
    }

    private async ValueTask<TitleWrite> MutateResolvedTitleAsync(
        VisibleTitle title,
        RevisionToken expected,
        AppearanceOverride? values,
        CancellationToken cancellationToken)
    {
        var result = await _store.TrySaveTitleAsync(
            title.OwnerItemId,
            expected,
            values,
            title.TitleName,
            title.OwnerKind,
            cancellationToken).ConfigureAwait(false);
        var snapshot = await _store.ReadAsync(cancellationToken).ConfigureAwait(false);
        var current = CreateEditable(snapshot, title);
        return result switch
        {
            StoreMutation<TitleState>.Applied => new TitleWrite.Applied(current),
            StoreMutation<TitleState>.Conflict => new TitleWrite.Conflict(current),
            _ => throw new InvalidOperationException("Unknown title store outcome.")
        };
    }

    private static AppearanceOverride GetOverride(AppearanceStoreSnapshot snapshot, ItemId ownerId)
    {
        return snapshot.Titles.TryGetValue(ownerId, out var title) && title.Override is not null
            ? title.Override
            : EmptyOverride;
    }

    private static RevisionToken GetRevision(AppearanceStoreSnapshot snapshot, ItemId ownerId)
    {
        return snapshot.Titles.TryGetValue(ownerId, out var title)
            ? title.Revision
            : RevisionToken.Initial;
    }

    private static EditableAppearance CreateEditable(AppearanceStoreSnapshot snapshot, VisibleTitle title)
    {
        var values = GetOverride(snapshot, title.OwnerItemId);
        return new EditableAppearance(
            title,
            snapshot.Global.Values,
            values,
            AppearanceResolver.Merge(snapshot.Global.Values, values),
            GetRevision(snapshot, title.OwnerItemId));
    }
}
