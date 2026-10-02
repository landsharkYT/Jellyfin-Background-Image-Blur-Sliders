using Jellyfin.Plugin.BackgroundBlurEditor.Web;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Tests;

public sealed class WebShellInjectionTests
{
    [Fact]
    public void InjectPreservesExistingScriptsAndAddsOneLoader()
    {
        const string html = "<html><body><script src=\"enhanced.js\"></script></body></html>";
        var transformed = WebShellInjectionMiddleware.Inject(html);

        Assert.Contains("enhanced.js", transformed, StringComparison.Ordinal);
        Assert.Contains("data-background-blur-editor", transformed, StringComparison.Ordinal);
        Assert.Equal(transformed, WebShellInjectionMiddleware.Inject(transformed));
    }

    [Fact]
    public void InjectLeavesMalformedShellUntouched()
    {
        const string html = "<html><body>missing close";
        Assert.Equal(html, WebShellInjectionMiddleware.Inject(html));
    }
}
