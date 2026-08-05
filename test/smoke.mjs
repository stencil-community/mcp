// End-to-end smoke test: launch the built server over stdio via the real MCP
// client and exercise every tool. Run: node test/smoke.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'dist', 'index.js');

// Build a throwaway Stencil-shaped project so the test is self-contained and
// fails on regression, rather than depending on a sibling checkout being present.
const targetProject = await mkdtemp(join(tmpdir(), 'stencil-mcp-smoke-'));
await writeFile(
  join(targetProject, 'package.json'),
  JSON.stringify({ dependencies: { '@stencil/core': '^4.43.0' } }),
);
const pkgDir = join(targetProject, 'node_modules', '@stencil', 'core');
await mkdir(pkgDir, { recursive: true });
await writeFile(join(pkgDir, 'package.json'), JSON.stringify({ version: '4.43.5' }));

const transport = new StdioClientTransport({ command: process.execPath, args: [serverEntry] });
const client = new Client({ name: 'smoke-test', version: '1.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '));

const version = await client.callTool({ name: 'detect_stencil_version', arguments: { projectRoot: targetProject } });
const versionText = version.content[0].text;
console.log('\ndetect_stencil_version ->\n' + versionText.split('\n')[0]);
assert.match(versionText, /4\.43\.5/, 'expected the fixture version 4.43.5 to be detected');

const listen = await client.callTool({ name: 'get_decorator_reference', arguments: { name: 'Listen' } });
console.log('\nget_decorator_reference(Listen) -> antiPattern present:', /antiPattern/.test(listen.content[0].text));

const bp = await client.callTool({ name: 'get_best_practices', arguments: {} });
console.log('get_best_practices -> rules:', JSON.parse(bp.content[0].text).length);

const life = await client.callTool({ name: 'get_lifecycle_reference', arguments: {} });
console.log('get_lifecycle_reference -> hooks:', JSON.parse(life.content[0].text).length);

await client.close();
console.log('\nSMOKE OK');
