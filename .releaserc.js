let commitMessage = 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}';
let publishArgs = '';
const packageName = process.env.npm_package_name;
const hasNativeBinaries = packageName === '@appland/appmap' || packageName === '@appland/scanner';

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

// Only create GitHub releases for packages with native binaries.
// Other packages only need git tags, which are created automatically.
if (hasNativeBinaries) {
  // Create draft releases to avoid race condition where clients see the release before binaries are attached.
  // The build-native workflows will publish the draft after all binaries are uploaded.
  plugins.push([
    '@semantic-release/github',
    {
      draftRelease: true,
    },
  ]);
}

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
