using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Web;

/// <summary>Injects the plugin client into the served Jellyfin Web shell.</summary>
public sealed class WebShellInjectionMiddleware
{
    private const string Marker = "data-background-blur-editor";
    private static readonly Action<ILogger, Exception?> LogInjectionFailure = LoggerMessage.Define(
        LogLevel.Warning,
        new EventId(1, "WebShellInjectionFailure"),
        "Could not inject Background Image Blur Editor into Jellyfin Web.");
    private readonly RequestDelegate _next;

    /// <summary>Initializes a new instance of the <see cref="WebShellInjectionMiddleware"/> class.</summary>
    public WebShellInjectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    /// <summary>Processes one request.</summary>
    public async Task InvokeAsync(HttpContext context, ILogger<WebShellInjectionMiddleware> logger)
    {
        if (!IsIndexRequest(context.Request))
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        var headers = context.Request.Headers;
        var acceptEncoding = headers.AcceptEncoding;
        var ifNoneMatch = headers.IfNoneMatch;
        var ifModifiedSince = headers.IfModifiedSince;
        var range = headers.Range;
        var ifRange = headers.IfRange;

        headers.Remove(HeaderNames.AcceptEncoding);
        headers.Remove(HeaderNames.IfNoneMatch);
        headers.Remove(HeaderNames.IfModifiedSince);
        headers.Remove(HeaderNames.Range);
        headers.Remove(HeaderNames.IfRange);

        var originalFeature = context.Features.Get<IHttpResponseBodyFeature>();
        using var buffer = new MemoryStream();
        context.Features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(buffer));

        try
        {
            await _next(context).ConfigureAwait(false);
        }
        finally
        {
            context.Features.Set(originalFeature);
            Restore(headers, HeaderNames.AcceptEncoding, acceptEncoding);
            Restore(headers, HeaderNames.IfNoneMatch, ifNoneMatch);
            Restore(headers, HeaderNames.IfModifiedSince, ifModifiedSince);
            Restore(headers, HeaderNames.Range, range);
            Restore(headers, HeaderNames.IfRange, ifRange);
        }

        var response = context.Response;
        var output = originalFeature?.Stream ?? response.Body;
        if (response.StatusCode != StatusCodes.Status200OK
            || buffer.Length == 0
            || !(response.ContentType?.Contains("text/html", StringComparison.OrdinalIgnoreCase) ?? false))
        {
            await CopyBufferAsync(buffer, output, context.RequestAborted).ConfigureAwait(false);
            return;
        }

        string html;
        try
        {
            html = Encoding.UTF8.GetString(buffer.GetBuffer(), 0, checked((int)buffer.Length));
            html = Inject(html);
        }
        catch (Exception ex) when (ex is ArgumentException or OverflowException)
        {
            LogInjectionFailure(logger, ex);
            await CopyBufferAsync(buffer, output, context.RequestAborted).ConfigureAwait(false);
            return;
        }

        var bytes = Encoding.UTF8.GetBytes(html);
        response.ContentType = "text/html;charset=utf-8";
        response.ContentLength = bytes.Length;
        response.Headers.Remove(HeaderNames.ContentEncoding);
        response.Headers.Remove(HeaderNames.ETag);
        response.Headers.Remove(HeaderNames.LastModified);
        response.Headers.Remove(HeaderNames.AcceptRanges);
        response.Headers.CacheControl = "no-cache";
        await output.WriteAsync(bytes, context.RequestAborted).ConfigureAwait(false);
    }

    internal static string Inject(string html)
    {
        if (html.Contains(Marker, StringComparison.OrdinalIgnoreCase))
        {
            return html;
        }

        var bodyClose = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        if (bodyClose < 0)
        {
            return html;
        }

        var version = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0";
        var tag = $"<script defer {Marker} src=\"../BackgroundBlurEditor/v1/assets/client.js?version={version}\"></script>";
        return string.Concat(html.AsSpan(0, bodyClose), tag, "\n", html.AsSpan(bodyClose));
    }

    private static bool IsIndexRequest(HttpRequest request)
    {
        if (!HttpMethods.IsGet(request.Method))
        {
            return false;
        }

        var path = request.Path.Value;
        if (string.IsNullOrEmpty(path))
        {
            return false;
        }

        return path.EndsWith("/web/", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith("/web/index.html", StringComparison.OrdinalIgnoreCase);
    }

    private static void Restore(IHeaderDictionary headers, string name, StringValues value)
    {
        if (!StringValues.IsNullOrEmpty(value))
        {
            headers[name] = value;
        }
    }

    private static async Task CopyBufferAsync(MemoryStream buffer, Stream output, CancellationToken cancellationToken)
    {
        buffer.Position = 0;
        await buffer.CopyToAsync(output, cancellationToken).ConfigureAwait(false);
    }
}
