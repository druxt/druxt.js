const base = process.env.GITHUB_BASE_REF || process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME
const current = process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_BRANCH

module.exports = {
  files: [{
    path: './packages/**/dist/*.js',
    maxSize: '50kb',
  }],
  ci: {
    // Derived, so a new release line needs no edit here. trackBranches
    // takes no pattern, so the current branch adds itself.
    repoBranchBase: base || current || '0.x',
    trackBranches: [...new Set([current].filter(Boolean))],
  }
}
