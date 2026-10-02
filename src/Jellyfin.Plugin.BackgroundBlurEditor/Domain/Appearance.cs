namespace Jellyfin.Plugin.BackgroundBlurEditor.Domain;

/// <summary>
/// A Jellyfin library item identifier.
/// </summary>
public readonly record struct ItemId(Guid Value)
{
    /// <summary>
    /// Creates a non-empty item identifier.
    /// </summary>
    public static bool TryCreate(Guid value, out ItemId itemId)
    {
        itemId = new ItemId(value);
        return value != Guid.Empty;
    }

    /// <inheritdoc />
    public override string ToString() => Value.ToString("N");
}

/// <summary>
/// A Jellyfin user identifier.
/// </summary>
public readonly record struct UserId(Guid Value)
{
    /// <summary>
    /// Creates a non-empty user identifier.
    /// </summary>
    public static bool TryCreate(Guid value, out UserId userId)
    {
        userId = new UserId(value);
        return value != Guid.Empty;
    }
}

/// <summary>
/// An integer opacity percentage.
/// </summary>
public readonly record struct Opacity
{
    private Opacity(int percent)
    {
        Percent = percent;
    }

    /// <summary>
    /// Gets the percentage from zero through one hundred.
    /// </summary>
    public int Percent { get; }

    /// <summary>
    /// Creates a validated opacity.
    /// </summary>
    public static bool TryCreate(int percent, out Opacity opacity)
    {
        if (percent is < 0 or > 100)
        {
            opacity = default;
            return false;
        }

        opacity = new Opacity(percent);
        return true;
    }
}

/// <summary>
/// An integer blur radius in pixels.
/// </summary>
public readonly record struct BlurPixels
{
    private BlurPixels(int value)
    {
        Value = value;
    }

    /// <summary>
    /// Gets the radius from zero through fifty pixels.
    /// </summary>
    public int Value { get; }

    /// <summary>
    /// Creates a validated blur radius.
    /// </summary>
    public static bool TryCreate(int value, out BlurPixels blur)
    {
        if (value is < 0 or > 50)
        {
            blur = default;
            return false;
        }

        blur = new BlurPixels(value);
        return true;
    }
}

/// <summary>
/// The four fully resolved appearance values.
/// </summary>
public sealed record Appearance(
    Opacity BackdropOpacity,
    BlurPixels BackdropBlur,
    Opacity PanelGlassOpacity,
    BlurPixels PanelGlassBlur)
{
    /// <summary>
    /// Gets the initial global appearance.
    /// </summary>
    public static Appearance Defaults { get; } = new(
        CreateOpacity(100),
        CreateBlur(0),
        CreateOpacity(70),
        CreateBlur(12));

    private static Opacity CreateOpacity(int value)
    {
        _ = Opacity.TryCreate(value, out var result);
        return result;
    }

    private static BlurPixels CreateBlur(int value)
    {
        _ = BlurPixels.TryCreate(value, out var result);
        return result;
    }
}

/// <summary>
/// Optional per-field values for one movie or series.
/// </summary>
public sealed record AppearanceOverride(
    Opacity? BackdropOpacity,
    BlurPixels? BackdropBlur,
    Opacity? PanelGlassOpacity,
    BlurPixels? PanelGlassBlur)
{
    /// <summary>
    /// Gets a value indicating whether every field inherits the global value.
    /// </summary>
    public bool IsEmpty =>
        BackdropOpacity is null
        && BackdropBlur is null
        && PanelGlassOpacity is null
        && PanelGlassBlur is null;
}

/// <summary>
/// A compare-and-swap token for one stored record.
/// </summary>
public readonly record struct RevisionToken(string Value)
{
    /// <summary>
    /// Gets the token for a record that has never been written.
    /// </summary>
    public static RevisionToken Initial { get; } = new("0");

    /// <summary>
    /// Creates a fresh opaque token.
    /// </summary>
    public static RevisionToken New() => new(Guid.NewGuid().ToString("N"));

    /// <summary>
    /// Parses a non-empty token.
    /// </summary>
    public static bool TryCreate(string? value, out RevisionToken revision)
    {
        revision = new RevisionToken(value ?? string.Empty);
        return !string.IsNullOrWhiteSpace(value);
    }
}

/// <summary>
/// Supported stored title kinds.
/// </summary>
public enum TitleKind
{
    /// <summary>A movie.</summary>
    Movie,

    /// <summary>A television series.</summary>
    Series
}

/// <summary>
/// Supported detail-page kinds.
/// </summary>
public enum ViewedKind
{
    /// <summary>A movie.</summary>
    Movie,

    /// <summary>A series.</summary>
    Series,

    /// <summary>A season that inherits from a series.</summary>
    Season,

    /// <summary>An episode that inherits from a series.</summary>
    Episode
}

/// <summary>
/// A title resolved through Jellyfin access rules.
/// </summary>
public sealed record VisibleTitle(
    ItemId RequestedItemId,
    ItemId OwnerItemId,
    string TitleName,
    TitleKind OwnerKind,
    ViewedKind ViewedKind,
    bool HasBackdrop);

/// <summary>
/// Pure appearance merge rules.
/// </summary>
public static class AppearanceResolver
{
    /// <summary>
    /// Applies a per-title override to the global appearance.
    /// </summary>
    public static Appearance Merge(Appearance global, AppearanceOverride values)
    {
        return new Appearance(
            values.BackdropOpacity ?? global.BackdropOpacity,
            values.BackdropBlur ?? global.BackdropBlur,
            values.PanelGlassOpacity ?? global.PanelGlassOpacity,
            values.PanelGlassBlur ?? global.PanelGlassBlur);
    }
}
