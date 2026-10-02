using Jellyfin.Plugin.BackgroundBlurEditor.Services;
using Jellyfin.Plugin.BackgroundBlurEditor.Storage;
using Jellyfin.Plugin.BackgroundBlurEditor.Web;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.BackgroundBlurEditor;

/// <summary>Registers plugin services with Jellyfin.</summary>
public sealed class PluginServiceRegistrator : IPluginServiceRegistrator
{
    /// <inheritdoc />
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        serviceCollection.AddSingleton<IAppearanceStore, JsonAppearanceStore>();
        serviceCollection.AddSingleton<ITitleDirectory, JellyfinTitleDirectory>();
        serviceCollection.AddSingleton<IBackgroundAppearanceService, BackgroundAppearanceService>();
        serviceCollection.AddSingleton<IStartupFilter, WebShellInjectionStartupFilter>();
    }
}
