module.exports = {
  branches: ['main'],
  extends: 'semantic-release-monorepo',
  plugins: [
    '@semantic-release/commit-analyzer',
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
        publishCmd: 'yarn npm publish',
      },
    ],
    '@semantic-release/git',
    '@semantic-release/github',
  ],
};
