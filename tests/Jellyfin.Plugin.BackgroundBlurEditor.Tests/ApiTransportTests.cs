using System.Text.Json;
using Jellyfin.Plugin.BackgroundBlurEditor.Api;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Tests;

public sealed class ApiTransportTests
{
    [Fact]
    public void AdminSnapshotUsesTheCamelCaseBrowserContract()
    {
        var appearance = new AppearanceDto(100, 0, 70, 12);
        var snapshot = new AdminSnapshotDto(
            new GlobalAppearanceDto(appearance, "0"),
            Array.Empty<ConfiguredTitleDto>());

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(snapshot));
        var root = document.RootElement;

        Assert.True(root.TryGetProperty("global", out var global));
        Assert.True(root.TryGetProperty("titles", out var titles));
        Assert.Equal(JsonValueKind.Array, titles.ValueKind);
        Assert.True(global.GetProperty("values").TryGetProperty("backdropOpacity", out _));
        Assert.Equal("0", global.GetProperty("revision").GetString());
    }
}
