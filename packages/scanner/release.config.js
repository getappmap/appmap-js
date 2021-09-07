module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer', // determine what needs to be released
    '@semantic-release/release-notes-generator', // generate release notes
    '@semantic-release/changelog', // append release notes to CHANGELOG.md
    '@semantic-release/npm', // publish to NPM using current login and config, bump `version`
    '@semantic-release/git', // commit code changes (CHANGELOG.md, package.json)
    '@semantic-release/github', // add a GitHub release
  ],
};
