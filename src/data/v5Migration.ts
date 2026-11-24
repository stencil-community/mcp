/**
 * Stencil 4 to 5 breaking changes that affect application and library code.
 *
 * Checked against `BREAKING_CHANGES.md` and the `stencil migrate` rules
 * (`packages/cli/src/migrations`) on the `v5` branch of stenciljs/core at
 * 56b8bdd3 (5.0.0-rc). Not exhaustive: see BREAKING_CHANGES_URL for the full list.
 */

export const BREAKING_CHANGES_URL =
  'https://github.com/stenciljs/core/blob/v5/BREAKING_CHANGES.md#stencil-v500';

export type MigrationArea = 'component' | 'config' | 'testing' | 'tooling';

export interface MigrationChange {
  id: string;
  area: MigrationArea;
  /** What was removed, renamed or changed. */
  before: string;
  /** What to do instead. */
  after: string;
  /** Whether `stencil migrate` rewrites it. */
  automatic: boolean;
}

export const V5_CHANGES: MigrationChange[] = [
  {
    id: 'encapsulation',
    area: 'component',
    before: '`shadow` and `scoped` in @Component()',
    after: "Use `encapsulation: { type: 'shadow' }` or `encapsulation: { type: 'scoped' }`.",
    automatic: true,
  },
  {
    id: 'form-associated',
    area: 'component',
    before: '`formAssociated` in @Component()',
    after: 'Use @AttachInternals(), which makes the component form-associated by default.',
    automatic: true,
  },
  {
    id: 'asset-imports',
    area: 'component',
    before: 'Importing .css, .svg, .txt, .frag or .vert files without a query',
    after: "Add `?stencil` to the import, e.g. './my.css?stencil'. Does not apply to styleUrl. Affects types only.",
    automatic: true,
  },
  {
    id: 'should-update',
    area: 'component',
    before: 'componentShouldUpdate(newVal, oldVal, propName)',
    after: 'Use componentShouldUpdate(changes), called once per render cycle with a map of name to { newVal, oldVal }.',
    automatic: false,
  },
  {
    id: 'host-data',
    area: 'component',
    before: 'hostData()',
    after: 'Return <Host> from render(). hostData() is silently ignored.',
    automatic: false,
  },
  {
    id: 'boolean-attributes',
    area: 'component',
    before: 'Boolean props treating the attribute value "false" as false',
    after: 'Remove the attribute or set the property to false. The attribute being present now always means true.',
    automatic: false,
  },
  {
    id: 'watch-timing',
    area: 'component',
    before: '@Watch() handlers running before the first render',
    after: 'Use @Watch(name, { immediate: true }) or call the handler from an earlier lifecycle method.',
    automatic: false,
  },
  {
    id: 'internal-imports',
    area: 'component',
    before:
      'Importing @stencil/core/internal, @stencil/core/internal/client, @stencil/core/internal/hydrate, @stencil/core/cli, @stencil/core/dev-server or @stencil/core/mock-doc',
    after:
      'Use @stencil/core/runtime, @stencil/core/runtime/client, @stencil/core/runtime/server, @stencil/cli, @stencil/dev-server or @stencil/mock-doc respectively.',
    automatic: false,
  },
  {
    id: 'output-targets',
    area: 'config',
    before: 'Output targets `dist`, `dist-custom-elements`, `dist-hydrate-script`, `dist-collection`, `dist-types`',
    after:
      'Use `loader-bundle`, `standalone`, `ssr`, `collection`, `types`. Default directories changed, so check package.json paths afterwards.',
    automatic: true,
  },
  {
    id: 'extras',
    area: 'config',
    before: '`extras` in stencil.config.ts',
    after: 'Use `compat`. Slot fix flags are combined into `compat.lightDomPatches`.',
    automatic: true,
  },
  {
    id: 'build-flags',
    area: 'config',
    before: '`buildDist`, `buildDocs` and `devMode` in stencil.config.ts',
    after: 'Use `skipInDev` on each output target, and the --dev CLI flag instead of devMode.',
    automatic: true,
  },
  {
    id: 'rollup',
    area: 'config',
    before: '`rollupPlugins` and `rollupConfig`',
    after: 'Use `rolldownPlugins` and `rolldownConfig`. Check that plugins support Rolldown.',
    automatic: true,
  },
  {
    id: 'es5',
    area: 'config',
    before: '`buildEs5` and ES5/SystemJS output',
    after: 'Remove the option. Stencil 5 builds for ES2022.',
    automatic: false,
  },
  {
    id: 'commonjs',
    area: 'config',
    before: 'CommonJS output by default',
    after: 'Set `cjs: true` on `loader-bundle` or `ssr` if CommonJS is still needed.',
    automatic: false,
  },
  {
    id: 'integrated-testing',
    area: 'testing',
    before: '`stencil test` and imports from @stencil/core/testing',
    after: 'Use @stencil/vitest for spec and component tests, and @stencil/playwright for end-to-end tests.',
    automatic: false,
  },
  {
    id: 'cli-flags',
    area: 'tooling',
    before: '`stencil build --prod`, `--docs` and `--esm`, and `stencil telemetry`',
    after: 'Remove them. Production is the default build; use `skipInDev` or `stencil docs` for docs.',
    automatic: false,
  },
  {
    id: 'requirements',
    area: 'tooling',
    before: 'Node.js 16+, bundled TypeScript',
    after: 'Use Node.js 22+ and install TypeScript 5 or 6 in the project.',
    automatic: false,
  },
];
