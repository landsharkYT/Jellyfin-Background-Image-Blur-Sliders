using Jellyfin.Plugin.BackgroundBlurEditor.Domain;
using Jellyfin.Plugin.BackgroundBlurEditor.Storage;
using Microsoft.Extensions.Logging.Abstractions;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Tests;

public sealed class JsonAppearanceStoreTests
{
    [Fact]
    public async Task PersistsResetTombstoneAndRejectsStaleWriter()
    {
        var directory = Path.Combine(Path.GetTempPath(), $"bibe-{Guid.NewGuid():N}");
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, "appearance-overrides.json");

        try
        {
            _ = ItemId.TryCreate(Guid.NewGuid(), out var itemId);
            _ = BlurPixels.TryCreate(18, out var blur);
            using var store = new JsonAppearanceStore(NullLogger<JsonAppearanceStore>.Instance, path);
            var saved = await store.TrySaveTitleAsync(
                itemId,
                RevisionToken.Initial,
                new AppearanceOverride(null, blur, null, null),
                "Example",
                TitleKind.Series,
                CancellationToken.None);
            var applied = Assert.IsType<StoreMutation<TitleState>.Applied>(saved);

            var reset = await store.TrySaveTitleAsync(
                itemId,
                applied.Value.Revision,
                null,
                "Example",
                TitleKind.Series,
                CancellationToken.None);
            var resetApplied = Assert.IsType<StoreMutation<TitleState>.Applied>(reset);
            Assert.Null(resetApplied.Value.Override);

            var stale = await store.TrySaveTitleAsync(
                itemId,
                RevisionToken.Initial,
                new AppearanceOverride(null, blur, null, null),
                "Example",
                TitleKind.Series,
                CancellationToken.None);
            Assert.IsType<StoreMutation<TitleState>.Conflict>(stale);

            using var reloaded = new JsonAppearanceStore(NullLogger<JsonAppearanceStore>.Instance, path);
            var snapshot = await reloaded.ReadAsync(CancellationToken.None);
            Assert.True(snapshot.Titles.TryGetValue(itemId, out var tombstone));
            Assert.Null(tombstone.Override);
            Assert.Equal(resetApplied.Value.Revision, tombstone.Revision);
        }
        finally
        {
            Directory.Delete(directory, true);
        }
    }

    [Fact]
    public async Task GlobalAndTitleRevisionsAreIndependent()
    {
        var directory = Path.Combine(Path.GetTempPath(), $"bibe-{Guid.NewGuid():N}");
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, "appearance-overrides.json");

        try
        {
            _ = ItemId.TryCreate(Guid.NewGuid(), out var itemId);
            using var store = new JsonAppearanceStore(NullLogger<JsonAppearanceStore>.Instance, path);
            var title = await store.TrySaveTitleAsync(
                itemId,
                RevisionToken.Initial,
                new AppearanceOverride(null, null, null, null),
                "Example",
                TitleKind.Movie,
                CancellationToken.None);
            Assert.IsType<StoreMutation<TitleState>.Applied>(title);

            _ = Opacity.TryCreate(80, out var opacity);
            var global = Appearance.Defaults with { BackdropOpacity = opacity };
            var globalWrite = await store.TrySaveGlobalAsync(
                RevisionToken.Initial,
                global,
                CancellationToken.None);
            Assert.IsType<StoreMutation<GlobalState>.Applied>(globalWrite);
        }
        finally
        {
            Directory.Delete(directory, true);
        }
    }
}
