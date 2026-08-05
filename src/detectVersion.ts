import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface StencilProjectInfo {
  found: boolean;
  /** Version resolved from the installed package in node_modules (authoritative). */
  installedVersion?: string;
  /** Version range declared in the project's package.json dependencies. */
  declaredRange?: string;
  /** Absolute path that was inspected. */
  projectRoot: string;
  message: string;
}

async function readJson(path: string): Promise<any | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return undefined;
  }
}

/**
 * Detects the StencilJS version a project is actually using.
 *
 * Resolution order:
 *  1. `<root>/node_modules/@stencil/core/package.json` (what will really run)
 *  2. The declared range in the project's own `package.json`
 */
export async function detectStencilVersion(projectRoot: string): Promise<StencilProjectInfo> {
  const root = resolve(projectRoot);

  const installedPkg = await readJson(join(root, 'node_modules', '@stencil', 'core', 'package.json'));
  const projectPkg = await readJson(join(root, 'package.json'));

  const declaredRange =
    projectPkg?.dependencies?.['@stencil/core'] ??
    projectPkg?.devDependencies?.['@stencil/core'] ??
    undefined;

  const installedVersion = installedPkg?.version;

  if (!installedVersion && !declaredRange) {
    return {
      found: false,
      projectRoot: root,
      message: `No @stencil/core dependency found at ${root}. Is this a Stencil project, and are dependencies installed?`,
    };
  }

  const parts: string[] = [];
  if (installedVersion) parts.push(`installed @stencil/core@${installedVersion}`);
  if (declaredRange) parts.push(`declared range "${declaredRange}"`);

  return {
    found: true,
    installedVersion,
    declaredRange,
    projectRoot: root,
    message: `This project uses ${parts.join(', ')}. Prefer APIs available in this version and avoid suggesting features from newer releases.`,
  };
}
