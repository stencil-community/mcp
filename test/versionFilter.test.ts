import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVersion, isAvailableIn, splitByVersion, forVersion } from '../src/versionFilter.ts';
import { DECORATORS, LIFECYCLE } from '../src/data/decorators.ts';

test('parseVersion coerces clean, ranged and prefixed versions', () => {
  assert.deepEqual(parseVersion('4.43.5'), { major: 4, minor: 43, patch: 5 });
  assert.deepEqual(parseVersion('^4.5.0'), { major: 4, minor: 5, patch: 0 });
  assert.deepEqual(parseVersion('>=4.0.0'), { major: 4, minor: 0, patch: 0 });
  assert.deepEqual(parseVersion('v5.1'), { major: 5, minor: 1, patch: 0 });
  assert.deepEqual(parseVersion('4.x'), { major: 4, minor: 0, patch: 0 });
  assert.deepEqual(parseVersion('5.0.0-beta.1'), { major: 5, minor: 0, patch: 0 });
});

test('parseVersion returns undefined for junk', () => {
  assert.equal(parseVersion(undefined), undefined);
  assert.equal(parseVersion('latest'), undefined);
  assert.equal(parseVersion(''), undefined);
});

test('isAvailableIn: no `since` is always available', () => {
  assert.equal(isAvailableIn('1.0.0', undefined), true);
  assert.equal(isAvailableIn(undefined, undefined), true);
});

test('isAvailableIn compares against the `since` marker', () => {
  assert.equal(isAvailableIn('4.5.0', '4.5.0'), true, 'equal version is available');
  assert.equal(isAvailableIn('4.43.5', '4.5.0'), true, 'newer version is available');
  assert.equal(isAvailableIn('4.4.0', '4.5.0'), false, 'older minor is unavailable');
  assert.equal(isAvailableIn('3.9.9', '4.5.0'), false, 'older major is unavailable');
});

test('isAvailableIn does not filter when a version cannot be parsed', () => {
  assert.equal(isAvailableIn('latest', '4.5.0'), true);
  assert.equal(isAvailableIn(undefined, '4.5.0'), true);
});

test('splitByVersion excludes AttachInternals on Stencil < 4.5', () => {
  const { available, unavailable } = splitByVersion(DECORATORS, '4.4.0');
  assert.ok(!available.some((d) => d.name === 'AttachInternals'), 'AttachInternals excluded');
  assert.ok(unavailable.some((u) => u.name === 'AttachInternals' && u.since === '4.5.0'));
});

test('splitByVersion keeps everything on a current version', () => {
  const { available, unavailable } = splitByVersion(DECORATORS, '4.43.5');
  assert.equal(available.length, DECORATORS.length);
  assert.equal(unavailable.length, 0);
});

test('splitByVersion keeps everything when version is undefined', () => {
  const { available, unavailable } = splitByVersion(DECORATORS, undefined);
  assert.equal(available.length, DECORATORS.length);
  assert.equal(unavailable.length, 0);
});

const decorator = (name: string, version?: string) =>
  forVersion(DECORATORS.find((d) => d.name === name)!, version);

test('forVersion gives the Stencil 4 API for Stencil 4', () => {
  const component = decorator('Component', '4.45.5');
  assert.match(component.example, /shadow: true/);
  assert.equal(component.docsUrl, 'https://stenciljs.com/docs/component');
  assert.equal(component.changes, undefined);
});

test('forVersion gives the Stencil 5 API for Stencil 5 and its prereleases', () => {
  for (const version of ['5.0.0', '5.0.0-rc.9', '^5.1.0']) {
    const component = decorator('Component', version);
    assert.match(component.example, /encapsulation: \{ type: 'shadow' \}/);
    assert.doesNotMatch(component.example, /shadow: true/);
    assert.equal(component.docsUrl, 'https://stenciljs.com/docs/v5/component');
  }
  assert.doesNotMatch(decorator('AttachInternals', '5.0.0').example, /formAssociated/);
});

test('forVersion applies only the changes introduced by that version', () => {
  assert.doesNotMatch(decorator('Watch', '4.39.0').signature, /immediate/);
  assert.match(decorator('Watch', '4.40.0').signature, /immediate/);
  assert.match(decorator('Watch', '5.0.0').signature, /immediate/);
});

test('forVersion leaves the entry alone when the version is unknown', () => {
  const source = DECORATORS.find((d) => d.name === 'Component')!;
  assert.equal(forVersion(source, undefined), source);
  assert.equal(forVersion(source, 'next'), source);
});

test('forVersion does not modify the reference data', () => {
  const before = JSON.stringify([DECORATORS, LIFECYCLE]);
  for (const item of DECORATORS) forVersion(item, '5.0.0');
  for (const item of LIFECYCLE) forVersion(item, '5.0.0');
  assert.equal(JSON.stringify([DECORATORS, LIFECYCLE]), before);
});
