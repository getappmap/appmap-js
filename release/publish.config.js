const baseConfig = require('./base.config');

module.exports = {
  branches: baseConfig.branches,
  extends: baseConfig.extends,
  plugins: [
    ...baseConfig.plugins,
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
