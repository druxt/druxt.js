module.exports = {
  files: [{
    path: './packages/**/dist/*.js',
    maxSize: '50kb',
  }],
  ci: {
    repoBranchBase: process.env.CI_PULL_REQUEST ? 'develop' : 'main',
    trackBranches: ['main', 'develop'],
  }
}
