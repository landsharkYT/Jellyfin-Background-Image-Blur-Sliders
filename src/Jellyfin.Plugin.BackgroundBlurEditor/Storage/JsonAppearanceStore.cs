using System.Text.Json;
using Jellyfin.Plugin.BackgroundBlurEditor.Domain;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.BackgroundBlurEditor.Storage;

/// <summary>Stores appearance data as an atomically replaced JSON document.</summary>
public sealed class JsonAppearanceStore : IAppearanceStore, IDisposable
{
    private const int SchemaVersion = 1;
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };
    private static readonly Action<ILogger, string, Exception?> LogLoadFailure = LoggerMessage.Define<string>(
        LogLevel.Error,
        new EventId(1, "AppearanceStoreLoadFailure"),
        "Could not load appearance data from {Path}; writes are disabled.");
    private static readonly Action<ILogger, Exception?> LogBackupFailure = LoggerMessage.Define(
        LogLevel.Warning,
        new EventId(2, "AppearanceStoreBackupFailure"),
        "Could not copy corrupt appearance data for diagnostics.");

    private readonly ILogger<JsonAppearanceStore> _logger;
    private readonly SemaphoreSlim _writeGate = new(1, 1);
    private readonly string? _testPath;
    private AppearanceStoreSnapshot? _snapshot;
    private Exception? _loadFailure;

    /// <summary>Initializes a store that uses the plugin data directory.</summary>
    public JsonAppearanceStore(ILogger<JsonAppearanceStore> logger)
    {
        _logger = logger;
    }

    internal JsonAppearanceStore(ILogger<JsonAppearanceStore> logger, string path)
    {
        _logger = logger;
        _testPath = path;
    }

    /// <inheritdoc />
    public async ValueTask<AppearanceStoreSnapshot> ReadAsync(CancellationToken cancellationToken)
    {
        await EnsureLoadedAsync(cancellationToken).ConfigureAwait(false);
        ThrowIfFaulted();
        return _snapshot!;
    }

    /// <inheritdoc />
    public async ValueTask<StoreMutation<GlobalState>> TrySaveGlobalAsync(
        RevisionToken expected,
        Appearance values,
        CancellationToken cancellationToken)
    {
        await _writeGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await EnsureLoadedInsideGateAsync(cancellationToken).ConfigureAwait(false);
            ThrowIfFaulted();
            var current = _snapshot!.Global;
            if (current.Revision != expected)
            {
                return new StoreMutation<GlobalState>.Conflict(current);
            }

            var nextGlobal = new GlobalState(values, RevisionToken.New());
            var next = new AppearanceStoreSnapshot(nextGlobal, _snapshot.Titles);
            await PersistAsync(next, cancellationToken).ConfigureAwait(false);
            _snapshot = next;
            return new StoreMutation<GlobalState>.Applied(nextGlobal);
        }
        finally
        {
            _writeGate.Release();
        }
    }

    /// <inheritdoc />
    public async ValueTask<StoreMutation<TitleState>> TrySaveTitleAsync(
        ItemId itemId,
        RevisionToken expected,
        AppearanceOverride? values,
        string titleName,
        TitleKind titleKind,
        CancellationToken cancellationToken)
    {
        await _writeGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await EnsureLoadedInsideGateAsync(cancellationToken).ConfigureAwait(false);
            ThrowIfFaulted();
            var current = GetTitleState(_snapshot!, itemId, titleName, titleKind);
            if (current.Revision != expected)
            {
                return new StoreMutation<TitleState>.Conflict(current);
            }

            var normalized = values is null || values.IsEmpty ? null : values;
            var nextTitle = new TitleState(itemId, normalized, RevisionToken.New(), titleName, titleKind);
            var titles = new Dictionary<ItemId, TitleState>(_snapshot!.Titles)
            {
                [itemId] = nextTitle
            };
            var next = new AppearanceStoreSnapshot(_snapshot.Global, titles);
            await PersistAsync(next, cancellationToken).ConfigureAwait(false);
            _snapshot = next;
            return new StoreMutation<TitleState>.Applied(nextTitle);
        }
        finally
        {
            _writeGate.Release();
        }
    }

    /// <inheritdoc />
    public void Dispose() => _writeGate.Dispose();

    private static TitleState GetTitleState(
        AppearanceStoreSnapshot snapshot,
        ItemId itemId,
        string titleName,
        TitleKind titleKind)
    {
        return snapshot.Titles.TryGetValue(itemId, out var current)
            ? current
            : new TitleState(itemId, null, RevisionToken.Initial, titleName, titleKind);
    }

    private async Task EnsureLoadedAsync(CancellationToken cancellationToken)
    {
        if (_snapshot is not null || _loadFailure is not null)
        {
            return;
        }

        await _writeGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await EnsureLoadedInsideGateAsync(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _writeGate.Release();
        }
    }

    private async Task EnsureLoadedInsideGateAsync(CancellationToken cancellationToken)
    {
        if (_snapshot is not null || _loadFailure is not null)
        {
            return;
        }

        var path = GetPath();
        if (!File.Exists(path))
        {
            _snapshot = EmptySnapshot();
            return;
        }

        try
        {
            await using var stream = File.OpenRead(path);
            var document = await JsonSerializer.DeserializeAsync<StoredDocument>(
                stream,
                SerializerOptions,
                cancellationToken).ConfigureAwait(false);
            _snapshot = ParseDocument(document ?? throw new InvalidDataException("The appearance file is empty."));
        }
        catch (Exception ex) when (ex is JsonException or IOException or InvalidDataException)
        {
            _loadFailure = ex;
            TryCopyCorruptFile(path);
            LogLoadFailure(_logger, path, ex);
        }
    }

    private async Task PersistAsync(AppearanceStoreSnapshot snapshot, CancellationToken cancellationToken)
    {
        var path = GetPath();
        var directory = Path.GetDirectoryName(path)
            ?? throw new InvalidOperationException("The appearance data path has no directory.");
        Directory.CreateDirectory(directory);
        var temporaryPath = Path.Combine(directory, $".{Path.GetFileName(path)}.{Guid.NewGuid():N}.tmp");

        try
        {
            await using (var stream = new FileStream(
                temporaryPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                4096,
                FileOptions.Asynchronous | FileOptions.WriteThrough))
            {
                await JsonSerializer.SerializeAsync(
                    stream,
                    ToDocument(snapshot),
                    SerializerOptions,
                    cancellationToken).ConfigureAwait(false);
                await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
            }

            File.Move(temporaryPath, path, true);
        }
        finally
        {
            if (File.Exists(temporaryPath))
            {
                File.Delete(temporaryPath);
            }
        }
    }

    private string GetPath()
    {
        if (_testPath is not null)
        {
            return _testPath;
        }

        var folder = Plugin.Instance?.DataFolderPath
            ?? throw new InvalidOperationException("The plugin data directory is not available yet.");
        return Path.Combine(folder, "appearance-overrides.json");
    }

    private void ThrowIfFaulted()
    {
        if (_loadFailure is not null)
        {
            throw new AppearanceStoreException("The appearance data file could not be loaded.", _loadFailure);
        }
    }

    private void TryCopyCorruptFile(string path)
    {
        try
        {
            var backup = $"{path}.corrupt-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}";
            File.Copy(path, backup, false);
        }
        catch (IOException ex)
        {
            LogBackupFailure(_logger, ex);
        }
    }

    private static AppearanceStoreSnapshot EmptySnapshot()
    {
        return new AppearanceStoreSnapshot(
            new GlobalState(Appearance.Defaults, RevisionToken.Initial),
            new Dictionary<ItemId, TitleState>());
    }

    private static StoredDocument ToDocument(AppearanceStoreSnapshot snapshot)
    {
        var titles = snapshot.Titles.ToDictionary(
            pair => pair.Key.ToString(),
            pair => new StoredTitle
            {
                Revision = pair.Value.Revision.Value,
                LastKnownTitle = pair.Value.LastKnownTitle,
                LastKnownKind = pair.Value.LastKnownKind.ToString(),
                Override = pair.Value.Override is null ? null : ToStoredAppearance(pair.Value.Override)
            },
            StringComparer.OrdinalIgnoreCase);

        return new StoredDocument
        {
            SchemaVersion = SchemaVersion,
            Global = new StoredGlobal
            {
                Revision = snapshot.Global.Revision.Value,
                Values = ToStoredAppearance(snapshot.Global.Values)
            },
            Titles = titles
        };
    }

    private static AppearanceStoreSnapshot ParseDocument(StoredDocument document)
    {
        if (document.SchemaVersion != SchemaVersion || document.Global?.Values is null)
        {
            throw new InvalidDataException("The appearance data schema is not supported.");
        }

        var global = new GlobalState(ParseAppearance(document.Global.Values), ParseRevision(document.Global.Revision));
        var titles = new Dictionary<ItemId, TitleState>();
        foreach (var pair in document.Titles ?? new Dictionary<string, StoredTitle>())
        {
            if (!Guid.TryParse(pair.Key, out var guid)
                || !ItemId.TryCreate(guid, out var itemId)
                || pair.Value is null
                || !Enum.TryParse<TitleKind>(pair.Value.LastKnownKind, true, out var kind))
            {
                throw new InvalidDataException($"The stored title key '{pair.Key}' is invalid.");
            }

            var values = pair.Value.Override is null ? null : ParseOverride(pair.Value.Override);
            titles[itemId] = new TitleState(
                itemId,
                values,
                ParseRevision(pair.Value.Revision),
                pair.Value.LastKnownTitle ?? string.Empty,
                kind);
        }

        return new AppearanceStoreSnapshot(global, titles);
    }

    private static Appearance ParseAppearance(StoredAppearance values)
    {
        if (!Opacity.TryCreate(values.BackdropOpacity ?? -1, out var backdropOpacity)
            || !BlurPixels.TryCreate(values.BackdropBlur ?? -1, out var backdropBlur)
            || !Opacity.TryCreate(values.PanelGlassOpacity ?? -1, out var panelOpacity)
            || !BlurPixels.TryCreate(values.PanelGlassBlur ?? -1, out var panelBlur))
        {
            throw new InvalidDataException("A stored global appearance value is outside its allowed range.");
        }

        return new Appearance(backdropOpacity, backdropBlur, panelOpacity, panelBlur);
    }

    private static AppearanceOverride ParseOverride(StoredAppearance values)
    {
        return new AppearanceOverride(
            ParseOptionalOpacity(values.BackdropOpacity),
            ParseOptionalBlur(values.BackdropBlur),
            ParseOptionalOpacity(values.PanelGlassOpacity),
            ParseOptionalBlur(values.PanelGlassBlur));
    }

    private static Opacity? ParseOptionalOpacity(int? value)
    {
        if (value is null)
        {
            return null;
        }

        if (!Opacity.TryCreate(value.Value, out var result))
        {
            throw new InvalidDataException("A stored opacity is outside its allowed range.");
        }

        return result;
    }

    private static BlurPixels? ParseOptionalBlur(int? value)
    {
        if (value is null)
        {
            return null;
        }

        if (!BlurPixels.TryCreate(value.Value, out var result))
        {
            throw new InvalidDataException("A stored blur radius is outside its allowed range.");
        }

        return result;
    }

    private static RevisionToken ParseRevision(string? value)
    {
        if (!RevisionToken.TryCreate(value, out var revision))
        {
            throw new InvalidDataException("A stored revision is missing.");
        }

        return revision;
    }

    private static StoredAppearance ToStoredAppearance(Appearance values)
    {
        return new StoredAppearance
        {
            BackdropOpacity = values.BackdropOpacity.Percent,
            BackdropBlur = values.BackdropBlur.Value,
            PanelGlassOpacity = values.PanelGlassOpacity.Percent,
            PanelGlassBlur = values.PanelGlassBlur.Value
        };
    }

    private static StoredAppearance ToStoredAppearance(AppearanceOverride values)
    {
        return new StoredAppearance
        {
            BackdropOpacity = values.BackdropOpacity?.Percent,
            BackdropBlur = values.BackdropBlur?.Value,
            PanelGlassOpacity = values.PanelGlassOpacity?.Percent,
            PanelGlassBlur = values.PanelGlassBlur?.Value
        };
    }

    private sealed class StoredDocument
    {
        public int SchemaVersion { get; set; }

        public StoredGlobal? Global { get; set; }

        public Dictionary<string, StoredTitle>? Titles { get; set; }
    }

    private sealed class StoredGlobal
    {
        public string? Revision { get; set; }

        public StoredAppearance? Values { get; set; }
    }

    private sealed class StoredTitle
    {
        public string? Revision { get; set; }

        public string? LastKnownTitle { get; set; }

        public string? LastKnownKind { get; set; }

        public StoredAppearance? Override { get; set; }
    }

    private sealed class StoredAppearance
    {
        public int? BackdropOpacity { get; set; }

        public int? BackdropBlur { get; set; }

        public int? PanelGlassOpacity { get; set; }

        public int? PanelGlassBlur { get; set; }
    }
}

/// <summary>Indicates that the appearance store cannot safely read or write its document.</summary>
public sealed class AppearanceStoreException : Exception
{
    /// <summary>Initializes a new instance of the <see cref="AppearanceStoreException"/> class.</summary>
    public AppearanceStoreException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
