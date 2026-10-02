using System.Reflection;
using Jellyfin.Plugin.BackgroundBlurEditor.Domain;
using Jellyfin.Plugin.BackgroundBlurEditor.Services;
using Jellyfin.Plugin.BackgroundBlurEditor.Storage;
using MediaBrowser.Common.Api;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Api;

/// <summary>HTTP boundary for Background Image Blur Editor.</summary>
[ApiController]
[Route("BackgroundBlurEditor/v1")]
public sealed class BackgroundBlurEditorController : ControllerBase
{
    private static readonly Dictionary<string, (string Resource, string ContentType)> Assets =
        new Dictionary<string, (string Resource, string ContentType)>(StringComparer.OrdinalIgnoreCase)
        {
            ["client.js"] = ("Jellyfin.Plugin.BackgroundBlurEditor.Web.dist.client.js", "application/javascript"),
            ["admin.js"] = ("Jellyfin.Plugin.BackgroundBlurEditor.Web.dist.admin.js", "application/javascript")
        };

    private readonly IBackgroundAppearanceService _appearances;

    /// <summary>Initializes a new instance of the <see cref="BackgroundBlurEditorController"/> class.</summary>
    public BackgroundBlurEditorController(IBackgroundAppearanceService appearances)
    {
        _appearances = appearances;
    }

    /// <summary>Returns the current client's management capability.</summary>
    [HttpGet("session")]
    [Authorize]
    public ActionResult GetSession()
    {
        return Ok(new SessionDto(User.IsInRole("Administrator")));
    }

    /// <summary>Returns effective appearance values for one visible item.</summary>
    [HttpGet("effective/{itemId:guid}")]
    [Authorize]
    public async Task<ActionResult> GetEffective(Guid itemId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUser(out var userId) || !ItemId.TryCreate(itemId, out var requestedItem))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _appearances.ReadEffectiveAsync(userId, requestedItem, cancellationToken).ConfigureAwait(false);
            return result switch
            {
                EffectiveRead.Found found => Ok(TransportMapper.ToDto(found.Appearance)),
                EffectiveRead.NotVisible => NotFound(),
                _ => StatusCode(StatusCodes.Status500InternalServerError)
            };
        }
        catch (AppearanceStoreException)
        {
            return StoreUnavailable();
        }
    }

    /// <summary>Returns editable values for one item.</summary>
    [HttpGet("admin/editor/{itemId:guid}")]
    [Authorize(Policy = Policies.RequiresElevation)]
    public async Task<ActionResult> GetEditor(Guid itemId, CancellationToken cancellationToken)
    {
        if (!ItemId.TryCreate(itemId, out var requestedItem))
        {
            return BadRequest(new { Message = "A non-empty item ID is required." });
        }

        try
        {
            var result = await _appearances.ReadEditorAsync(requestedItem, cancellationToken).ConfigureAwait(false);
            return result switch
            {
                EditorRead.Found found => Ok(TransportMapper.ToDto(found.Appearance)),
                EditorRead.NotFound => NotFound(),
                _ => StatusCode(StatusCodes.Status500InternalServerError)
            };
        }
        catch (AppearanceStoreException)
        {
            return StoreUnavailable();
        }
    }

    /// <summary>Returns global settings and configured titles.</summary>
    [HttpGet("admin/snapshot")]
    [Authorize(Policy = Policies.RequiresElevation)]
    public async Task<ActionResult> GetAdminSnapshot([FromQuery] string? search, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _appearances.ReadAdminAsync(search, cancellationToken).ConfigureAwait(false);
            return Ok(TransportMapper.ToDto(result));
        }
        catch (AppearanceStoreException)
        {
            return StoreUnavailable();
        }
    }

    /// <summary>Saves global values.</summary>
    [HttpPut("admin/global")]
    [Authorize(Policy = Policies.RequiresElevation)]
    public async Task<ActionResult> SaveGlobal([FromBody] SaveGlobalRequest request, CancellationToken cancellationToken)
    {
        if (!TransportMapper.TryParse(request, out var revision, out var appearance))
        {
            return BadRequest(new { Message = "Opacity must be 0-100, blur must be 0-50, and a revision is required." });
        }

        try
        {
            var result = await _appearances.SaveGlobalAsync(revision, appearance, cancellationToken).ConfigureAwait(false);
            return result switch
            {
                GlobalWrite.Applied applied => Ok(TransportMapper.ToDto(applied.Appearance)),
                GlobalWrite.Conflict conflict => Conflict(TransportMapper.ToDto(conflict.Current)),
                _ => StatusCode(StatusCodes.Status500InternalServerError)
            };
        }
        catch (AppearanceStoreException)
        {
            return StoreUnavailable();
        }
    }

    /// <summary>Saves one title override.</summary>
    [HttpPut("admin/titles/{itemId:guid}")]
    [Authorize(Policy = Policies.RequiresElevation)]
    public async Task<ActionResult> SaveTitle(
        Guid itemId,
        [FromBody] SaveTitleRequest request,
        CancellationToken cancellationToken)
    {
        if (!ItemId.TryCreate(itemId, out var requestedItem)
            || !TransportMapper.TryParse(request, out var revision, out var appearance))
        {
            return BadRequest(new { Message = "The item, values, or revision are invalid." });
        }

        try
        {
            var result = await _appearances.SaveTitleAsync(
                requestedItem,
                revision,
                appearance,
                cancellationToken).ConfigureAwait(false);
            return MapTitleWrite(result);
        }
        catch (AppearanceStoreException)
        {
            return StoreUnavailable();
        }
    }

    /// <summary>Resets one title override.</summary>
    [HttpDelete("admin/titles/{itemId:guid}")]
    [Authorize(Policy = Policies.RequiresElevation)]
    public async Task<ActionResult> ResetTitle(
        Guid itemId,
        [FromQuery] string? expectedRevision,
        CancellationToken cancellationToken)
    {
        if (!ItemId.TryCreate(itemId, out var requestedItem)
            || !RevisionToken.TryCreate(expectedRevision, out var revision))
        {
            return BadRequest(new { Message = "The item and expected revision are required." });
        }

        try
        {
            var result = await _appearances.ResetTitleAsync(
                requestedItem,
                revision,
                cancellationToken).ConfigureAwait(false);
            return MapTitleWrite(result);
        }
        catch (AppearanceStoreException)
        {
            return StoreUnavailable();
        }
    }

    /// <summary>Serves an allowlisted embedded browser asset.</summary>
    [HttpGet("assets/{fileName}")]
    [AllowAnonymous]
    public ActionResult GetAsset(string fileName, [FromQuery] string? version = null)
    {
        _ = version;
        if (!Assets.TryGetValue(fileName, out var asset))
        {
            return NotFound();
        }

        var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(asset.Resource);
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        return new FileStreamResult(stream, asset.ContentType);
    }

    private ActionResult MapTitleWrite(TitleWrite result)
    {
        return result switch
        {
            TitleWrite.Applied applied => Ok(TransportMapper.ToDto(applied.Appearance)),
            TitleWrite.Conflict conflict => Conflict(TransportMapper.ToDto(conflict.Current)),
            TitleWrite.NotFound => NotFound(),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    private bool TryGetCurrentUser(out UserId userId)
    {
        userId = default;
        var value = User.Claims.FirstOrDefault(claim =>
            claim.Type.Equals("Jellyfin-UserId", StringComparison.OrdinalIgnoreCase))?.Value;
        return Guid.TryParse(value, out var id) && UserId.TryCreate(id, out userId);
    }

    private static ObjectResult StoreUnavailable()
    {
        return new ObjectResult(new { Message = "The appearance data file is unavailable. Check the Jellyfin server log." })
        {
            StatusCode = StatusCodes.Status503ServiceUnavailable
        };
    }
}
