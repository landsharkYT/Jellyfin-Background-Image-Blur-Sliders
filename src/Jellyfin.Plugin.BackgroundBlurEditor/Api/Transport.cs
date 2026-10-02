using System.Text.Json.Serialization;
using Jellyfin.Plugin.BackgroundBlurEditor.Domain;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Api;

/// <summary>Wire representation of fully resolved values.</summary>
public sealed record AppearanceDto(
    [property: JsonPropertyName("backdropOpacity")] int BackdropOpacity,
    [property: JsonPropertyName("backdropBlur")] int BackdropBlur,
    [property: JsonPropertyName("panelGlassOpacity")] int PanelGlassOpacity,
    [property: JsonPropertyName("panelGlassBlur")] int PanelGlassBlur);

/// <summary>Wire representation of optional per-title values.</summary>
public sealed record AppearanceOverrideDto(
    [property: JsonPropertyName("backdropOpacity")] int? BackdropOpacity,
    [property: JsonPropertyName("backdropBlur")] int? BackdropBlur,
    [property: JsonPropertyName("panelGlassOpacity")] int? PanelGlassOpacity,
    [property: JsonPropertyName("panelGlassBlur")] int? PanelGlassBlur);

/// <summary>Effective values available to a signed-in viewer.</summary>
public sealed record EffectiveAppearanceDto(
    [property: JsonPropertyName("requestedItemId")] string RequestedItemId,
    [property: JsonPropertyName("ownerItemId")] string OwnerItemId,
    [property: JsonPropertyName("titleName")] string TitleName,
    [property: JsonPropertyName("titleKind")] string TitleKind,
    [property: JsonPropertyName("viewedKind")] string ViewedKind,
    [property: JsonPropertyName("hasBackdrop")] bool HasBackdrop,
    [property: JsonPropertyName("backdropBlurInherited")] bool BackdropBlurInherited,
    [property: JsonPropertyName("values")] AppearanceDto Values);

/// <summary>Editable values available to an administrator.</summary>
public sealed record EditableAppearanceDto(
    [property: JsonPropertyName("requestedItemId")] string RequestedItemId,
    [property: JsonPropertyName("ownerItemId")] string OwnerItemId,
    [property: JsonPropertyName("titleName")] string TitleName,
    [property: JsonPropertyName("titleKind")] string TitleKind,
    [property: JsonPropertyName("viewedKind")] string ViewedKind,
    [property: JsonPropertyName("hasBackdrop")] bool HasBackdrop,
    [property: JsonPropertyName("global")] AppearanceDto Global,
    [property: JsonPropertyName("override")] AppearanceOverrideDto Override,
    [property: JsonPropertyName("effective")] AppearanceDto Effective,
    [property: JsonPropertyName("revision")] string Revision);

/// <summary>Administrator view of global settings.</summary>
public sealed record GlobalAppearanceDto(
    [property: JsonPropertyName("values")] AppearanceDto Values,
    [property: JsonPropertyName("revision")] string Revision);

/// <summary>One administrator table row.</summary>
public sealed record ConfiguredTitleDto(
    [property: JsonPropertyName("itemId")] string ItemId,
    [property: JsonPropertyName("titleName")] string TitleName,
    [property: JsonPropertyName("titleKind")] string? TitleKind,
    [property: JsonPropertyName("isMissing")] bool IsMissing,
    [property: JsonPropertyName("override")] AppearanceOverrideDto Override,
    [property: JsonPropertyName("effective")] AppearanceDto Effective,
    [property: JsonPropertyName("revision")] string Revision);

/// <summary>Complete administrator configuration view.</summary>
public sealed record AdminSnapshotDto(
    [property: JsonPropertyName("global")] GlobalAppearanceDto Global,
    [property: JsonPropertyName("titles")] IReadOnlyList<ConfiguredTitleDto> Titles);

/// <summary>Current browser session capabilities.</summary>
public sealed record SessionDto([property: JsonPropertyName("canManage")] bool CanManage);

/// <summary>Request to change global values.</summary>
public sealed record SaveGlobalRequest(
    [property: JsonPropertyName("expectedRevision")] string? ExpectedRevision,
    [property: JsonPropertyName("backdropOpacity")] int BackdropOpacity,
    [property: JsonPropertyName("backdropBlur")] int BackdropBlur,
    [property: JsonPropertyName("panelGlassOpacity")] int PanelGlassOpacity,
    [property: JsonPropertyName("panelGlassBlur")] int PanelGlassBlur);

/// <summary>Request to change one title override.</summary>
public sealed record SaveTitleRequest(
    [property: JsonPropertyName("expectedRevision")] string? ExpectedRevision,
    [property: JsonPropertyName("backdropOpacity")] int? BackdropOpacity,
    [property: JsonPropertyName("backdropBlur")] int? BackdropBlur,
    [property: JsonPropertyName("panelGlassOpacity")] int? PanelGlassOpacity,
    [property: JsonPropertyName("panelGlassBlur")] int? PanelGlassBlur);

internal static class TransportMapper
{
    public static AppearanceDto ToDto(Appearance values)
    {
        return new AppearanceDto(
            values.BackdropOpacity.Percent,
            values.BackdropBlur.Value,
            values.PanelGlassOpacity.Percent,
            values.PanelGlassBlur.Value);
    }

    public static AppearanceOverrideDto ToDto(AppearanceOverride values)
    {
        return new AppearanceOverrideDto(
            values.BackdropOpacity?.Percent,
            values.BackdropBlur?.Value,
            values.PanelGlassOpacity?.Percent,
            values.PanelGlassBlur?.Value);
    }

    public static EffectiveAppearanceDto ToDto(EffectiveAppearance value)
    {
        return new EffectiveAppearanceDto(
            value.RequestedItemId.ToString(),
            value.OwnerItemId.ToString(),
            value.TitleName,
            value.TitleKind.ToString(),
            value.ViewedKind.ToString(),
            value.HasBackdrop,
            value.BackdropBlurInherited,
            ToDto(value.Values));
    }

    public static EditableAppearanceDto ToDto(EditableAppearance value)
    {
        return new EditableAppearanceDto(
            value.Title.RequestedItemId.ToString(),
            value.Title.OwnerItemId.ToString(),
            value.Title.TitleName,
            value.Title.OwnerKind.ToString(),
            value.Title.ViewedKind.ToString(),
            value.Title.HasBackdrop,
            ToDto(value.Global),
            ToDto(value.Override),
            ToDto(value.Effective),
            value.Revision.Value);
    }

    public static GlobalAppearanceDto ToDto(GlobalAppearance value)
    {
        return new GlobalAppearanceDto(ToDto(value.Values), value.Revision.Value);
    }

    public static AdminSnapshotDto ToDto(AdminSnapshot value)
    {
        return new AdminSnapshotDto(
            ToDto(value.Global),
            value.Titles.Select(title => new ConfiguredTitleDto(
                title.ItemId.ToString(),
                title.TitleName,
                title.TitleKind?.ToString(),
                title.IsMissing,
                ToDto(title.Override),
                ToDto(title.Effective),
                title.Revision.Value)).ToArray());
    }

    public static bool TryParse(SaveGlobalRequest request, out RevisionToken revision, out Appearance appearance)
    {
        appearance = Appearance.Defaults;
        if (!RevisionToken.TryCreate(request.ExpectedRevision, out revision)
            || !Opacity.TryCreate(request.BackdropOpacity, out var backdropOpacity)
            || !BlurPixels.TryCreate(request.BackdropBlur, out var backdropBlur)
            || !Opacity.TryCreate(request.PanelGlassOpacity, out var panelOpacity)
            || !BlurPixels.TryCreate(request.PanelGlassBlur, out var panelBlur))
        {
            return false;
        }

        appearance = new Appearance(backdropOpacity, backdropBlur, panelOpacity, panelBlur);
        return true;
    }

    public static bool TryParse(
        SaveTitleRequest request,
        out RevisionToken revision,
        out AppearanceOverride appearance)
    {
        appearance = new AppearanceOverride(null, null, null, null);
        if (!RevisionToken.TryCreate(request.ExpectedRevision, out revision)
            || !TryOptionalOpacity(request.BackdropOpacity, out var backdropOpacity)
            || !TryOptionalBlur(request.BackdropBlur, out var backdropBlur)
            || !TryOptionalOpacity(request.PanelGlassOpacity, out var panelOpacity)
            || !TryOptionalBlur(request.PanelGlassBlur, out var panelBlur))
        {
            return false;
        }

        appearance = new AppearanceOverride(backdropOpacity, backdropBlur, panelOpacity, panelBlur);
        return true;
    }

    private static bool TryOptionalOpacity(int? value, out Opacity? opacity)
    {
        if (value is null)
        {
            opacity = null;
            return true;
        }

        if (!Opacity.TryCreate(value.Value, out var parsed))
        {
            opacity = null;
            return false;
        }

        opacity = parsed;
        return true;
    }

    private static bool TryOptionalBlur(int? value, out BlurPixels? blur)
    {
        if (value is null)
        {
            blur = null;
            return true;
        }

        if (!BlurPixels.TryCreate(value.Value, out var parsed))
        {
            blur = null;
            return false;
        }

        blur = parsed;
        return true;
    }
}
