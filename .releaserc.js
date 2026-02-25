const packageName = process.env.npm_package_name;
const hasNativeBinaries = packageName === '@appland/appmap' || packageName === '@appland/scanner';

let commitMessage = `chore(release): ${packageName} \${nextRelease.version} [skip ci]\n\n\${nextRelease.notes}`;
let publishArgs = '';

if (hasNativeBinaries) {
  // Don't publish @appland/{appmap,scanner} as latest. This is done in a follow-up step.
  publishArgs = '--tag next';

  // Similarly, don't include the [skip ci] in the commit message. Otherwise the following step will
  // not execute.
  commitMessage = commitMessage.replace(/\s\[skip ci\]/, '');
}

const plugins = [
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
];

// Note: GitHub releases for native packages are created by the build-native workflow,
// after all binaries are attached, to avoid a race condition where clients see the
// release without binaries. Semantic-release only creates the git tag.

plugins.push([
  '@semantic-release/exec',
  {
    verifyConditionsCmd: 'test -n "$YARN_NPM_AUTH_TOKEN"',
    publishCmd: `yarn npm publish ${publishArgs}`,
  },
]);

module.exports = {
  branches: ['main'],
  plugins,
  extends: 'semantic-release-monorepo',
};
