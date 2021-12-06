module.exports = {
  branches: [
    'main',
    {
      name: 'develop',
      prerelease: true
    }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    '@semantic-release/npm',
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        message:
          // eslint-disable-next-line no-template-curly-in-string
          'chore(release): set `package.json` to ${nextRelease.version} [skip ci]'
      }
    ]
  ]
};
