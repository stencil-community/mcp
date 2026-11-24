import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findV4Usage } from '../src/v5Migration.ts';
import { V5_CHANGES } from '../src/data/v5Migration.ts';

const ids = (code: string) => findV4Usage(code).map((f) => f.change.id);

test('migration changes have unique ids and replacements', () => {
  assert.equal(new Set(V5_CHANGES.map((c) => c.id)).size, V5_CHANGES.length);
  for (const c of V5_CHANGES) assert.ok(c.before && c.after, `${c.id} needs before/after`);
});

test('finds replaced @Component options with their line', () => {
  const findings = findV4Usage(
    `import { Component } from '@stencil/core';\n\n@Component({\n  tag: 'my-input',\n  shadow: { delegatesFocus: true },\n  formAssociated: true,\n})\nexport class MyInput {}`,
  );
  assert.deepEqual(
    findings.map((f) => [f.change.id, f.line]),
    [
      ['encapsulation', 5],
      ['form-associated', 6],
    ],
  );
  assert.deepEqual(ids(`@Component({ tag: 'my-a', scoped: true }) class A {}`), ['encapsulation']);
});

test('accepts a Stencil 5 component', () => {
  const code = `
    import { Component, h, Prop } from '@stencil/core';
    import styles from './my-a.css?stencil';
    @Component({
      tag: 'my-a',
      styleUrl: 'my-a.css',
      encapsulation: { type: 'shadow', delegatesFocus: true },
    })
    export class MyA {
      @Prop() disabled: boolean;
      private options = { shadow: true, scoped: true };
      componentShouldUpdate(changes) { return !changes.disabled; }
      render() { return <p>don't use extras: or devMode:</p>; }
    }`;
  assert.deepEqual(ids(code), []);
});

test('ignores comments, strings and nested keys', () => {
  assert.deepEqual(ids(`@Component({\n  tag: 'my-a', // shadow: true\n  /* scoped: true, */\n})\nclass A {}`), []);
  assert.deepEqual(ids(`@Component({ tag: 'my-a', styles: 'a, shadow: true' }) class A {}`), []);
  assert.deepEqual(ids(`@Component({ tag: 'my-a', styles: { md: 'x', shadow: 'y' } }) class A {}`), []);
  assert.deepEqual(ids(`// @Component({ shadow: true })`), []);
});

test('an apostrophe in JSX text does not start a string', () => {
  const code = `function A() { return <p>don't</p>; }\n// @Component({ shadow: true })\nconst b = 'b';`;
  assert.deepEqual(ids(code), []);
});

test('finds asset imports that need ?stencil', () => {
  assert.deepEqual(ids(`import styles from './a.css';`), ['asset-imports']);
  assert.deepEqual(ids(`import './a.css';`), ['asset-imports']);
  assert.deepEqual(ids(`const a = await import("./a.svg");`), ['asset-imports']);
  assert.deepEqual(ids(`import a from './a.svg?format=text';`), []);
});

test('finds changed lifecycle methods, but not calls to them', () => {
  assert.deepEqual(ids(`class A { componentShouldUpdate(newVal, oldVal, propName) { return true; } }`), ['should-update']);
  assert.deepEqual(
    ids(`class A { componentShouldUpdate(newVal: any, oldVal: any): boolean { return true; } }`),
    ['should-update'],
  );
  assert.deepEqual(ids(`class A {\n  hostData() {\n    return {};\n  }\n}`), ['host-data']);
  assert.deepEqual(ids(`cmp.componentShouldUpdate(a, b, 'c');\nthis.hostData();`), []);
});

test('finds moved and removed imports', () => {
  assert.deepEqual(ids(`import { x } from '@stencil/core/internal/client';`), ['internal-imports']);
  assert.deepEqual(ids(`import { newSpecPage } from '@stencil/core/testing';`), ['integrated-testing']);
  assert.deepEqual(ids(`import { h } from '@stencil/core';`), []);
});

test('finds changed config options', () => {
  const code = `
    import { Config } from '@stencil/core';
    export const config: Config = {
      buildEs5: true,
      extras: { experimentalSlotFixes: true },
      rollupPlugins: {},
      outputTargets: [{ type: 'dist' }, { type: 'dist-custom-elements' }, { type: 'www' }],
    };`;
  assert.deepEqual(ids(code), ['es5', 'extras', 'rollup', 'output-targets', 'output-targets']);
});

test('only reads short option names inside a Stencil config', () => {
  assert.deepEqual(ids(`const a = { type: 'dist', extras: 1, devMode: true };`), []);
});

test('finds removed CLI usage in package.json', () => {
  const code = `{\n  "scripts": {\n    "build": "stencil build --docs --prod",\n    "test": "stencil test --spec",\n    "dev": "stencil build --dev --watch"\n  }\n}`;
  assert.deepEqual(ids(code), ['cli-flags', 'integrated-testing']);
});
