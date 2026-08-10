/**
 * Version-aware filtering for the reference tools.
 *
 * Stencil's public API carries `since` markers (e.g. `@AttachInternals` is
 * `since: 4.5.0`). Given the version a project is actually running, these
 * helpers decide which reference entries apply so an agent is never told to
 * use an API that does not exist in the installed framework.
 */

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Coerces a version-ish string into `{ major, minor, patch }`.
 *
 * Accepts clean versions ("4.43.5") and the messier forms that show up in a
 * `package.json` range or a `detect_stencil_version` result — a leading range
 * operator ("^4.43.0", "~4.5", ">=4.0.0"), a "v" prefix, an `x` wildcard, or a
 * prerelease/build suffix ("5.0.0-beta.1"). Returns `undefined` when no
 * numeric version can be recovered.
 */
export function parseVersion(input?: string): ParsedVersion | undefined {
  if (!input) return undefined;
  const match = input.match(/(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/i);
  if (!match) return undefined;
  const toNum = (part: string | undefined): number => {
    if (part === undefined || part === 'x' || part === '*') return 0;
    const n = Number(part);
    return Number.isFinite(n) ? n : 0;
  };
  return { major: toNum(match[1]), minor: toNum(match[2]), patch: toNum(match[3]) };
}

/** Returns true when `a` is greater than or equal to `b`. */
function gte(a: ParsedVersion, b: ParsedVersion): boolean {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch >= b.patch;
}

/**
 * Whether an API introduced in `since` is available in `version`.
 *
 * An entry with no `since` is part of the original API and always available.
 * If either version cannot be parsed we do not filter it out — better to show
 * a possibly-inapplicable entry than to hide a real one on a parsing quirk.
 */
export function isAvailableIn(version: string | undefined, since?: string): boolean {
  if (!since) return true;
  const v = parseVersion(version);
  const s = parseVersion(since);
  if (!v || !s) return true;
  return gte(v, s);
}

export interface VersionSplit<T extends { name: string; since?: string }> {
  available: T[];
  /** Entries excluded because they were introduced after `version`. */
  unavailable: { name: string; since: string }[];
}

/**
 * Splits `items` into those available in `version` and those introduced later.
 * When `version` is undefined or unparseable, everything is available.
 */
export function splitByVersion<T extends { name: string; since?: string }>(
  items: T[],
  version: string | undefined,
): VersionSplit<T> {
  const available: T[] = [];
  const unavailable: { name: string; since: string }[] = [];
  for (const item of items) {
    if (isAvailableIn(version, item.since)) {
      available.push(item);
    } else {
      unavailable.push({ name: item.name, since: item.since! });
    }
  }
  return { available, unavailable };
}
