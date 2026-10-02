using Jellyfin.Plugin.BackgroundBlurEditor.Domain;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Tests;

public sealed class AppearanceTests
{
    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void OpacityRejectsValuesOutsideRange(int value)
    {
        Assert.False(Opacity.TryCreate(value, out _));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(51)]
    public void BlurRejectsValuesOutsideRange(int value)
    {
        Assert.False(BlurPixels.TryCreate(value, out _));
    }

    [Fact]
    public void MergeUsesEachOverrideIndependently()
    {
        _ = Opacity.TryCreate(35, out var panelOpacity);
        _ = BlurPixels.TryCreate(22, out var backdropBlur);
        var values = AppearanceResolver.Merge(
            Appearance.Defaults,
            new AppearanceOverride(null, backdropBlur, panelOpacity, null));

        Assert.Equal(100, values.BackdropOpacity.Percent);
        Assert.Equal(22, values.BackdropBlur.Value);
        Assert.Equal(35, values.PanelGlassOpacity.Percent);
        Assert.Equal(12, values.PanelGlassBlur.Value);
    }
}
