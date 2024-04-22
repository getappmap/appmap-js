let commitMessage = 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}';
let plublishArgs = '';
if (process.env.npm_package_name === '@appland/appmap') {
  // Don't publish @appland/appmap as latest. This is done in a follow-up step.
  plublishArgs = '--tag next';

  // Similarly, don't include the [skip ci] in the commit message. Otherwise the following step will
  // not execute.
  commitMessage = commitMessage.replace(/\s\[skip ci\]/, '');
}

module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          {
            type: 'feature',
            release: 'minor',
          },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@google/semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['package.json'],
            from: /(?<="version":\s*").*(?=")/,
            to: '${nextRelease.version}',
            countMatches: true,
            results: [
              {
                file: 'package.json',
                hasChanged: true,
                numMatches: 1,
                numReplacements: 1,
              },
            ],
          },
        ],
      },
    ],
    [
      '@semantic-release/exec',
      {
        publishCmd: 'yarn build',
      },
    ],
    [
      '@semantic-release/git',
      {
        message: commitMessage,
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/exec',
      {
        verifyConditionsCmd: 'test -n "$YARN_NPM_AUTH_TOKEN"',
        publishCmd: `yarn npm publish ${plublishArgs}`,
      },
    ],
  ],
  extends: 'semantic-release-monorepo',
};
