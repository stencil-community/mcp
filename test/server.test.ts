import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectStencilVersion } from '../src/detectVersion.ts';
import { DECORATORS, LIFECYCLE } from '../src/data/decorators.ts';
import { BEST_PRACTICES } from '../src/data/bestPractices.ts';

test('detectStencilVersion reads the installed version from node_modules', async () => {
  const root = await mkdtemp(join(tmpdir(), 'stencil-mcp-'));
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ dependencies: { '@stencil/core': '^4.43.0' } }),
  );
  const pkgDir = join(root, 'node_modules', '@stencil', 'core');
  await mkdir(pkgDir, { recursive: true });
  await writeFile(join(pkgDir, 'package.json'), JSON.stringify({ version: '4.43.5' }));

  const info = await detectStencilVersion(root);
  assert.equal(info.found, true);
  assert.equal(info.installedVersion, '4.43.5');
  assert.equal(info.declaredRange, '^4.43.0');
  assert.match(info.message, /4\.43\.5/);
});

test('detectStencilVersion reports when no Stencil dependency exists', async () => {
  const root = await mkdtemp(join(tmpdir(), 'stencil-mcp-'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'not-stencil' }));
  const info = await detectStencilVersion(root);
  assert.equal(info.found, false);
});

test('every decorator has a summary, docs url and example', () => {
  assert.ok(DECORATORS.length >= 8);
  for (const d of DECORATORS) {
    assert.ok(d.summary.length > 10, `${d.name} needs a summary`);
    assert.match(d.docsUrl, /^https:\/\/stenciljs\.com/, `${d.name} needs a stencil docs url`);
    assert.ok(d.example.length > 0, `${d.name} needs an example`);
  }
});

test('lifecycle reference includes the core hooks', () => {
  const names = LIFECYCLE.map((l) => l.name);
  for (const required of ['componentWillLoad', 'componentDidLoad', 'render', 'disconnectedCallback']) {
    assert.ok(names.includes(required), `missing lifecycle ${required}`);
  }
});

test('best practices are well-formed wrong/right pairs', () => {
  assert.ok(BEST_PRACTICES.length >= 5);
  const ids = new Set<string>();
  for (const b of BEST_PRACTICES) {
    assert.ok(!ids.has(b.id), `duplicate id ${b.id}`);
    ids.add(b.id);
    assert.ok(b.wrong && b.right && b.why, `${b.id} needs wrong/right/why`);
  }
});
