module.exports = {
  files: [{
    path: './packages/**/dist/*.js',
    maxSize: '50kb',
  }],
  ci: {
    repoBranchBase: 'main',
    trackBranches: ['main', 'develop'],
  }
}
