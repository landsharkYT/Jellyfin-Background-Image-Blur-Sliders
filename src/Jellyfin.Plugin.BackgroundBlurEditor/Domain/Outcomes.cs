namespace Jellyfin.Plugin.BackgroundBlurEditor.Domain;

/// <summary>
/// Effective appearance returned to an authenticated viewer.
/// </summary>
public sealed record EffectiveAppearance(
    ItemId RequestedItemId,
    ItemId OwnerItemId,
    string TitleName,
    TitleKind TitleKind,
    ViewedKind ViewedKind,
    bool HasBackdrop,
    bool BackdropBlurInherited,
    Appearance Values);

/// <summary>
/// Editable appearance returned only to administrators.
/// </summary>
public sealed record EditableAppearance(
    VisibleTitle Title,
    Appearance Global,
    AppearanceOverride Override,
    Appearance Effective,
    RevisionToken Revision);

/// <summary>
/// Global appearance and revision.
/// </summary>
public sealed record GlobalAppearance(Appearance Values, RevisionToken Revision);

/// <summary>
/// One configured-title row.
/// </summary>
public sealed record ConfiguredTitle(
    ItemId ItemId,
    string TitleName,
    TitleKind? TitleKind,
    bool IsMissing,
    AppearanceOverride Override,
    Appearance Effective,
    RevisionToken Revision);

/// <summary>
/// Administrator configuration snapshot.
/// </summary>
public sealed record AdminSnapshot(GlobalAppearance Global, IReadOnlyList<ConfiguredTitle> Titles);

/// <summary>
/// Result of a viewer read.
/// </summary>
public abstract record EffectiveRead
{
    private EffectiveRead()
    {
    }

    /// <summary>The item is visible and supported.</summary>
    public sealed record Found(EffectiveAppearance Appearance) : EffectiveRead;

    /// <summary>The item is absent, inaccessible, or unsupported.</summary>
    public sealed record NotVisible : EffectiveRead;
}

/// <summary>
/// Result of an administrator editor read.
/// </summary>
public abstract record EditorRead
{
    private EditorRead()
    {
    }

    /// <summary>The item is editable.</summary>
    public sealed record Found(EditableAppearance Appearance) : EditorRead;

    /// <summary>The item is absent, inaccessible, or unsupported.</summary>
    public sealed record NotFound : EditorRead;
}

/// <summary>
/// Result of a global write.
/// </summary>
public abstract record GlobalWrite
{
    private GlobalWrite()
    {
    }

    /// <summary>The write succeeded.</summary>
    public sealed record Applied(GlobalAppearance Appearance) : GlobalWrite;

    /// <summary>The expected revision was stale.</summary>
    public sealed record Conflict(GlobalAppearance Current) : GlobalWrite;
}

/// <summary>
/// Result of a title write.
/// </summary>
public abstract record TitleWrite
{
    private TitleWrite()
    {
    }

    /// <summary>The write succeeded.</summary>
    public sealed record Applied(EditableAppearance Appearance) : TitleWrite;

    /// <summary>The expected revision was stale.</summary>
    public sealed record Conflict(EditableAppearance Current) : TitleWrite;

    /// <summary>The item is not a supported title.</summary>
    public sealed record NotFound : TitleWrite;
}
