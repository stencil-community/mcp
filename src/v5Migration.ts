/**
 * Finds Stencil 4 APIs in source code that changed in Stencil 5.
 *
 * This is a text scan, meant for checking a snippet before suggesting it. It
 * does not replace `stencil migrate`, which parses and rewrites whole projects.
 */

import { V5_CHANGES, type MigrationChange } from './data/v5Migration.js';

export interface MigrationFinding {
  /** 1-indexed. */
  line: number;
  found: string;
  change: MigrationChange;
}

export function findV4Usage(code: string): MigrationFinding[] {
  const source = blankComments(code);
  const findings: MigrationFinding[] = [];

  const add = (id: string, index: number, found: string) => {
    const change = V5_CHANGES.find((c) => c.id === id)!;
    const line = code.slice(0, index).split('\n').length;
    findings.push({ line, found: found.trim(), change });
  };
  const addMatches = (id: string, pattern: RegExp) => {
    for (const match of source.matchAll(pattern)) {
      add(id, match.index + match[0].indexOf(match[1]), match[1]);
    }
  };

  for (const { key, index } of componentOptionKeys(source)) {
    if (key === 'shadow' || key === 'scoped') add('encapsulation', index, key);
    if (key === 'formAssociated') add('form-associated', index, key);
  }

  addMatches(
    'asset-imports',
    /\b(?:from|import)\s*\(?\s*['"]([^'"?\n]+\.(?:css|svg|txt|frag|vert))['"]/gi,
  );
  addMatches(
    'internal-imports',
    /['"](@stencil\/core\/(?:internal(?:\/(?:client|hydrate))?|cli|dev-server|mock-doc))['"]/g,
  );
  addMatches('integrated-testing', /['"](@stencil\/core\/testing)['"]/g);
  addMatches('integrated-testing', /\b(stencil\s+test)\b/g);
  addMatches('should-update', /\b(componentShouldUpdate\s*\([^(),]+,[^)]*\))[^;{}]*\{/g);
  addMatches('host-data', /(?:^|[;{}])\s*(?:(?:public|private|protected)\s+)?(hostData\s*\(\s*\))[^;{}]*\{/gm);
  addMatches('cli-flags', /\b(stencil\s+build\b[^"'\n&|;]*\s--(?:prod|docs|esm)\b)/g);
  addMatches('cli-flags', /\b(stencil\s+telemetry)\b/g);

  // Short option names are only meaningful inside a Stencil config.
  if (/\boutputTargets\s*:|:\s*Config\b|\bdefineConfig\b/.test(source)) {
    addMatches(
      'output-targets',
      /\btype\s*:\s*['"](dist(?:-custom-elements|-hydrate-script|-collection|-types)?)['"]/g,
    );
    addMatches(
      'output-target-options',
      /\b(esmLoaderPath|collectionDir|typesDir|isPrimaryPackageOutputTarget|generateTypeDeclarations)\s*:/g,
    );
    addMatches('extras', /\b(extras)\s*:/g);
    addMatches('build-flags', /\b(buildDist|buildDocs|devMode)\s*:/g);
    addMatches('rollup', /\b(rollupPlugins|rollupConfig)\s*:/g);
    addMatches('es5', /\b(buildEs5)\s*:/g);
  }

  return findings.sort((a, b) => a.line - b.line);
}

/** Replaces comments with spaces, keeping every offset and line break in place. */
function blankComments(code: string): string {
  const out = code.split('');
  let i = 0;
  while (i < code.length) {
    const end = skipString(code, i);
    if (end > i) {
      i = end;
      continue;
    }
    let commentEnd = i;
    if (code.startsWith('//', i) && code[i - 1] !== ':') {
      commentEnd = code.indexOf('\n', i);
    } else if (code.startsWith('/*', i)) {
      commentEnd = code.indexOf('*/', i + 2);
      if (commentEnd !== -1) commentEnd += 2;
    } else {
      i++;
      continue;
    }
    if (commentEnd === -1) commentEnd = code.length;
    for (; i < commentEnd; i++) if (code[i] !== '\n') out[i] = ' ';
  }
  return out.join('');
}

/**
 * Returns the index after the string starting at `i`, or `i` if there is none.
 * A quote that is not closed on its line (an apostrophe in JSX text) is ignored.
 */
function skipString(code: string, i: number): number {
  const quote = code[i];
  if (quote !== '"' && quote !== "'" && quote !== '`') return i;
  for (let j = i + 1; j < code.length; j++) {
    if (code[j] === '\\') j++;
    else if (code[j] === quote) return j + 1;
    else if (code[j] === '\n' && quote !== '`') return i;
  }
  return i;
}

/** The local names `Component` is imported under, e.g. `Cmp` for `Component as Cmp`. */
function componentNames(source: string): Set<string> {
  const names = new Set(['Component']);
  for (const [, specifiers] of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@stencil\/core['"]/g)) {
    const alias = /\bComponent\s+as\s+([\w$]+)/.exec(specifiers)?.[1];
    if (alias) names.add(alias);
  }
  return names;
}

/** Yields the top-level keys of every `@Component({ ... })` options object. */
function* componentOptionKeys(source: string): Generator<{ key: string; index: number }> {
  const names = componentNames(source);
  for (const match of source.matchAll(/@([\w$]+)\s*\(\s*\{/g)) {
    if (!names.has(match[1])) continue;
    let depth = 1;
    let i = match.index + match[0].length;
    let expectKey = true;
    while (i < source.length && depth > 0) {
      const stringEnd = skipString(source, i);
      if (stringEnd > i) {
        i = stringEnd;
        expectKey = false;
        continue;
      }
      const char = source[i];
      if ('{[('.includes(char)) depth++;
      else if ('}])'.includes(char)) depth--;
      else if (char === ',' && depth === 1) expectKey = true;
      else if (expectKey) {
        const key = /^([A-Za-z_$][\w$]*)\s*:/.exec(source.slice(i))?.[1];
        if (key) yield { key, index: i };
        if (/\S/.test(char)) expectKey = false;
      }
      i++;
    }
  }
}
