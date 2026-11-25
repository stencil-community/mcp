// RELEASE_TYPE (patch | minor | major) forces the bump; unset/"auto" lets
// conventional commits decide. Set by the "version_bump" input of release.yml.
const forced = process.env.RELEASE_TYPE && process.env.RELEASE_TYPE !== 'auto';

export default {
  branches: ['main'],
  repositoryUrl: 'https://github.com/stencil-community/mcp',
  plugins: [
    forced ? './scripts/force-release-type.mjs' : '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};
