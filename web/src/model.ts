export type Appearance = Readonly<{
  backdropOpacity: number;
  backdropBlur: number;
  panelGlassOpacity: number;
  panelGlassBlur: number;
}>;

export type AppearanceOverride = Readonly<{
  backdropOpacity: number | null;
  backdropBlur: number | null;
  panelGlassOpacity: number | null;
  panelGlassBlur: number | null;
}>;

export type EffectiveAppearance = Readonly<{
  requestedItemId: string;
  ownerItemId: string;
  titleName: string;
  titleKind: 'Movie' | 'Series';
  viewedKind: 'Movie' | 'Series' | 'Season' | 'Episode';
  hasBackdrop: boolean;
  values: Appearance;
}>;

export type EditableAppearance = Readonly<{
  requestedItemId: string;
  ownerItemId: string;
  titleName: string;
  titleKind: 'Movie' | 'Series';
  viewedKind: 'Movie' | 'Series' | 'Season' | 'Episode';
  hasBackdrop: boolean;
  global: Appearance;
  override: AppearanceOverride;
  effective: Appearance;
  revision: string;
}>;

export type GlobalAppearance = Readonly<{
  values: Appearance;
  revision: string;
}>;

export type ConfiguredTitle = Readonly<{
  itemId: string;
  titleName: string;
  titleKind: 'Movie' | 'Series' | null;
  isMissing: boolean;
  override: AppearanceOverride;
  effective: Appearance;
  revision: string;
}>;

export type AdminSnapshot = Readonly<{
  global: GlobalAppearance;
  titles: readonly ConfiguredTitle[];
}>;

export function mergeAppearance(global: Appearance, override: AppearanceOverride): Appearance {
  return {
    backdropOpacity: override.backdropOpacity ?? global.backdropOpacity,
    backdropBlur: override.backdropBlur ?? global.backdropBlur,
    panelGlassOpacity: override.panelGlassOpacity ?? global.panelGlassOpacity,
    panelGlassBlur: override.panelGlassBlur ?? global.panelGlassBlur
  };
}

export function parseEffective(value: unknown): EffectiveAppearance {
  const record = requireRecord(value, 'effective appearance');
  return {
    requestedItemId: requireString(record.requestedItemId, 'requestedItemId'),
    ownerItemId: requireString(record.ownerItemId, 'ownerItemId'),
    titleName: requireString(record.titleName, 'titleName'),
    titleKind: requireTitleKind(record.titleKind),
    viewedKind: requireViewedKind(record.viewedKind),
    hasBackdrop: requireBoolean(record.hasBackdrop, 'hasBackdrop'),
    values: parseAppearance(record.values)
  };
}

export function parseEditable(value: unknown): EditableAppearance {
  const record = requireRecord(value, 'editable appearance');
  return {
    requestedItemId: requireString(record.requestedItemId, 'requestedItemId'),
    ownerItemId: requireString(record.ownerItemId, 'ownerItemId'),
    titleName: requireString(record.titleName, 'titleName'),
    titleKind: requireTitleKind(record.titleKind),
    viewedKind: requireViewedKind(record.viewedKind),
    hasBackdrop: requireBoolean(record.hasBackdrop, 'hasBackdrop'),
    global: parseAppearance(record.global),
    override: parseOverride(record.override),
    effective: parseAppearance(record.effective),
    revision: requireString(record.revision, 'revision')
  };
}

export function parseGlobal(value: unknown): GlobalAppearance {
  const record = requireRecord(value, 'global appearance');
  return {
    values: parseAppearance(record.values),
    revision: requireString(record.revision, 'revision')
  };
}

export function parseSnapshot(value: unknown): AdminSnapshot {
  const record = requireRecord(value, 'admin snapshot');
  if (!Array.isArray(record.titles)) {
    throw new Error('titles must be an array');
  }

  return {
    global: parseGlobal(record.global),
    titles: record.titles.map(parseConfiguredTitle)
  };
}

function parseConfiguredTitle(value: unknown): ConfiguredTitle {
  const record = requireRecord(value, 'configured title');
  const rawKind = record.titleKind;
  return {
    itemId: requireString(record.itemId, 'itemId'),
    titleName: requireString(record.titleName, 'titleName'),
    titleKind: rawKind === null ? null : requireTitleKind(rawKind),
    isMissing: requireBoolean(record.isMissing, 'isMissing'),
    override: parseOverride(record.override),
    effective: parseAppearance(record.effective),
    revision: requireString(record.revision, 'revision')
  };
}

function parseAppearance(value: unknown): Appearance {
  const record = requireRecord(value, 'appearance');
  return {
    backdropOpacity: requireInteger(record.backdropOpacity, 0, 100, 'backdropOpacity'),
    backdropBlur: requireInteger(record.backdropBlur, 0, 50, 'backdropBlur'),
    panelGlassOpacity: requireInteger(record.panelGlassOpacity, 0, 100, 'panelGlassOpacity'),
    panelGlassBlur: requireInteger(record.panelGlassBlur, 0, 50, 'panelGlassBlur')
  };
}

function parseOverride(value: unknown): AppearanceOverride {
  const record = requireRecord(value, 'appearance override');
  return {
    backdropOpacity: optionalInteger(record.backdropOpacity, 0, 100, 'backdropOpacity'),
    backdropBlur: optionalInteger(record.backdropBlur, 0, 50, 'backdropBlur'),
    panelGlassOpacity: optionalInteger(record.panelGlassOpacity, 0, 100, 'panelGlassOpacity'),
    panelGlassBlur: optionalInteger(record.panelGlassBlur, 0, 50, 'panelGlassBlur')
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} through ${maximum}`);
  }
  return value;
}

function optionalInteger(value: unknown, minimum: number, maximum: number, label: string): number | null {
  return value === null ? null : requireInteger(value, minimum, maximum, label);
}

function requireTitleKind(value: unknown): 'Movie' | 'Series' {
  if (value !== 'Movie' && value !== 'Series') {
    throw new Error('titleKind is not supported');
  }
  return value;
}

function requireViewedKind(value: unknown): 'Movie' | 'Series' | 'Season' | 'Episode' {
  if (value !== 'Movie' && value !== 'Series' && value !== 'Season' && value !== 'Episode') {
    throw new Error('viewedKind is not supported');
  }
  return value;
}
