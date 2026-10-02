using Jellyfin.Plugin.BackgroundBlurEditor.Domain;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Storage;

/// <summary>Stored global state.</summary>
public sealed record GlobalState(Appearance Values, RevisionToken Revision);

/// <summary>Stored state for one movie or series. A null override is a reset tombstone.</summary>
public sealed record TitleState(
    ItemId ItemId,
    AppearanceOverride? Override,
    RevisionToken Revision,
    string LastKnownTitle,
    TitleKind LastKnownKind)
{
    /// <summary>Gets whether the title has active custom values.</summary>
    public bool IsConfigured => Override is not null && !Override.IsEmpty;
}

/// <summary>One immutable view of the appearance file.</summary>
public sealed record AppearanceStoreSnapshot(GlobalState Global, IReadOnlyDictionary<ItemId, TitleState> Titles);

/// <summary>Result of a compare-and-swap store operation.</summary>
public abstract record StoreMutation<T>
{
    private StoreMutation()
    {
    }

    /// <summary>The new value was stored.</summary>
    public sealed record Applied(T Value) : StoreMutation<T>;

    /// <summary>The expected revision was stale.</summary>
    public sealed record Conflict(T Current) : StoreMutation<T>;
}

/// <summary>Persists global and per-title appearance data.</summary>
public interface IAppearanceStore
{
    /// <summary>Reads the current complete snapshot.</summary>
    ValueTask<AppearanceStoreSnapshot> ReadAsync(CancellationToken cancellationToken);

    /// <summary>Saves the global values if the expected revision is current.</summary>
    ValueTask<StoreMutation<GlobalState>> TrySaveGlobalAsync(
        RevisionToken expected,
        Appearance values,
        CancellationToken cancellationToken);

    /// <summary>Saves or resets one title if the expected revision is current.</summary>
    ValueTask<StoreMutation<TitleState>> TrySaveTitleAsync(
        ItemId itemId,
        RevisionToken expected,
        AppearanceOverride? values,
        string titleName,
        TitleKind titleKind,
        CancellationToken cancellationToken);
}
