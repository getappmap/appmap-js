const baseConfig = require('./base.config');

module.exports = {
  branches: baseConfig.branches,
  extends: baseConfig.extends,
  plugins: [
    ...baseConfig.plugins,
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
  ],
};
