import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVersion, isAvailableIn, splitByVersion } from '../src/versionFilter.ts';
import { DECORATORS } from '../src/data/decorators.ts';

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
  assert.deepEqual(unavailable, [{ name: 'AttachInternals', since: '4.5.0' }]);
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
