using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Web;

/// <summary>Places web-shell injection ahead of Jellyfin's static-file pipeline.</summary>
public sealed class WebShellInjectionStartupFilter : IStartupFilter
{
    /// <inheritdoc />
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.UseMiddleware<WebShellInjectionMiddleware>();
            next(app);
        };
    }
}
