import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { altersPublished, checkPlan, currentMilestone, hasChangeset, shippedDepChanges } from '../plan.mjs'
import { helpFor } from '../plan-help.mjs'

const dirs = ['blocks', 'druxt', 'menu', 'router']
const open = ['0.25.0', '0.26.0', '1.0.0', '1.1.0', '2.0.0', '2.1.0']
const conforming = {
  files: ['packages/menu/src/stores/menu.js', '.changeset/brave-moons-wave.md'],
  milestone: '0.25.0',
  issues: [838],
  openMilestones: open,
  baseBranch: '0.x',
  dirs,
}

describe('altersPublished', () => {
  it('is true for the source of a published package', () => {
    assert.equal(altersPublished(['packages/menu/src/index.js'], dirs), true)
  })

  it('is false for a private package, which never reaches a release', () => {
    assert.equal(altersPublished(['packages/docgen/src/index.js'], dirs), false)
  })

  it('is false for a README, because a wording fix is not a release', () => {
    assert.equal(altersPublished(['packages/menu/README.md'], dirs), false)
  })

  it('is false for tests, CI and documentation', () => {
    const files = ['packages/menu/test/index.test.js', '.github/workflows/ci.yml', 'RELEASING.md']
    assert.equal(altersPublished(files, dirs), false)
  })
})

describe('shippedDepChanges', () => {
  const one = (path, before, after) => [{ path, before, after }]

  it('reports a bumped dependency of a published package', () => {
    const changes = shippedDepChanges(
      one('packages/menu/package.json', { dependencies: { axios: '0.33.0' } }, { dependencies: { axios: '0.34.0' } }),
      dirs
    )
    assert.deepEqual(changes, [{ pkg: 'menu', section: 'dependencies', name: 'axios', from: '0.33.0', to: '0.34.0' }])
  })

  it('reports a moved peer range, the axios pin that drifted twice', () => {
    const changes = shippedDepChanges(
      one(
        'packages/druxt/package.json',
        { peerDependencies: { axios: '0.28.0', consola: '*' } },
        { peerDependencies: { axios: '0.34.0', consola: '*' } }
      ),
      dirs
    )
    assert.equal(changes.length, 1)
    assert.equal(changes[0].section, 'peerDependencies')
  })

  it('ignores devDependencies, which never reach an install', () => {
    const changes = shippedDepChanges(
      one('packages/menu/package.json', { devDependencies: { lodash: '^4.17.21' } }, { devDependencies: { lodash: '^4.18.1' } }),
      dirs
    )
    assert.deepEqual(changes, [])
  })

  it('ignores a private package and the root manifest', () => {
    const priv = one('packages/docgen/package.json', { dependencies: { yargs: '1' } }, { dependencies: { yargs: '2' } })
    assert.deepEqual(shippedDepChanges(priv, dirs), [])
    const root = one('package.json', { dependencies: { semver: '1' } }, { dependencies: { semver: '2' } })
    assert.deepEqual(shippedDepChanges(root, dirs), [])
  })

  it('reports an added and a removed dependency', () => {
    const added = shippedDepChanges(one('packages/menu/package.json', {}, { dependencies: { axios: '0.34.0' } }), dirs)
    assert.deepEqual(added, [{ pkg: 'menu', section: 'dependencies', name: 'axios', from: null, to: '0.34.0' }])
    const gone = shippedDepChanges(one('packages/menu/package.json', { dependencies: { axios: '0.34.0' } }, {}), dirs)
    assert.deepEqual(gone, [{ pkg: 'menu', section: 'dependencies', name: 'axios', from: '0.34.0', to: null }])
  })

  it('treats a missing side as an empty contract rather than throwing', () => {
    assert.deepEqual(shippedDepChanges(one('packages/menu/package.json', null, null), dirs), [])
  })
})

describe('checkPlan and shipped dependencies', () => {
  const depBump = {
    files: ['packages/druxt/package.json', 'yarn.lock'],
    manifests: [
      {
        path: 'packages/druxt/package.json',
        before: { peerDependencies: { axios: '0.28.0' } },
        after: { peerDependencies: { axios: '0.34.0' } },
      },
    ],
    milestone: '0.25.0',
    issues: [838],
    openMilestones: open,
    baseBranch: '0.x',
    dirs,
  }

  it('wants a changeset for a dependency bump that moves no source file', () => {
    const problems = checkPlan(depBump)
    assert.deepEqual(
      problems.map((problem) => problem.code),
      ['no-changeset']
    )
    assert.match(problems[0].message, /peerDependencies: axios 0\.28\.0 -> 0\.34\.0/)
  })

  it('passes once that bump carries a changeset', () => {
    assert.deepEqual(checkPlan({ ...depBump, files: [...depBump.files, '.changeset/brave-moons-wave.md'] }), [])
  })

  const versionManifests = [
    {
      path: 'packages/blocks/package.json',
      before: { dependencies: { druxt: '^0.24.0' } },
      after: { dependencies: { druxt: '^0.25.0' } },
    },
  ]

  it("leaves the release's own version pull request alone, whose internal ranges all move", () => {
    const problems = checkPlan({
      ...depBump,
      files: ['packages/blocks/package.json', 'packages/blocks/CHANGELOG.md'],
      manifests: versionManifests,
      milestone: null,
      issues: [],
      headBranch: 'changeset-release/0.x',
    })
    assert.deepEqual(problems, [])
  })

  it('wants a changelog too, so that naming a branch is not enough to be waived', () => {
    const problems = checkPlan({
      ...depBump,
      files: ['packages/blocks/package.json'],
      manifests: versionManifests,
      milestone: null,
      issues: [],
      headBranch: 'changeset-release/0.x',
    })
    assert.deepEqual(
      problems.map((problem) => problem.code),
      ['no-changeset', 'no-issue', 'no-milestone']
    )
  })

  it('still answers for source, however the branch is named', () => {
    const problems = checkPlan({
      ...depBump,
      files: ['packages/druxt/src/client.js', 'packages/blocks/package.json', 'packages/blocks/CHANGELOG.md'],
      manifests: versionManifests,
      headBranch: 'changeset-release/0.x',
    })
    assert.deepEqual(
      problems.map((problem) => problem.code),
      ['no-changeset']
    )
  })

  it('names the dependency changes even when source moved as well', () => {
    const problems = checkPlan({ ...depBump, files: ['packages/druxt/src/client.js', 'packages/druxt/package.json'] })
    assert.match(problems[0].message, /changes a published package, and what one installs for consumers in/)
    assert.match(problems[0].message, /peerDependencies: axios 0\.28\.0 -> 0\.34\.0/)
  })

  it('is silent when no manifest is passed at all', () => {
    assert.deepEqual(checkPlan({ ...depBump, files: ['RELEASING.md'], manifests: undefined }), [])
  })
})

describe('hasChangeset', () => {
  it('ignores the changeset directory README', () => {
    assert.equal(hasChangeset(['.changeset/README.md']), false)
    assert.equal(hasChangeset(['.changeset/brave-moons-wave.md']), true)
  })
})

describe('currentMilestone', () => {
  it('is the lowest open milestone sharing the line major', () => {
    assert.equal(currentMilestone(open, '0.x'), '0.25.0')
    assert.equal(currentMilestone(open, '1.0.x'), '1.0.0')
    assert.equal(currentMilestone(open, '2.0.x'), '2.0.0')
  })

  it('orders numerically rather than as strings', () => {
    assert.equal(currentMilestone(['0.9.0', '0.10.0'], '0.x'), '0.9.0')
    assert.equal(currentMilestone(['1.2.0', '1.10.0', '1.3.0'], '1.0.x'), '1.2.0')
  })

  it('advances on its own once a milestone closes', () => {
    assert.equal(currentMilestone(['0.26.0', '1.0.0'], '0.x'), '0.26.0')
  })

  it('is null for a branch with no major, and for a major with none open', () => {
    assert.equal(currentMilestone(open, 'feature/thing'), null)
    assert.equal(currentMilestone(open, '9.x'), null)
  })
})

describe('checkPlan', () => {
  it('passes a conforming pull request', () => {
    assert.deepEqual(checkPlan(conforming), [])
  })

  it('leaves alone anything that does not alter a published package', () => {
    const files = ['RELEASING.md', '.github/workflows/ci.yml', 'packages/docgen/src/index.js']
    const problems = checkPlan({ ...conforming, files, milestone: null, issues: [] })
    assert.deepEqual(problems, [], 'documentation, CI and private packages are not gated')
  })

  it('refuses a published change with no changeset', () => {
    const problems = checkPlan({ ...conforming, files: ['packages/menu/src/index.js'] })
    assert.equal(problems.length, 1)
    assert.match(problems[0].message, /no changeset/)
  })

  it('refuses a published change with no linked issue', () => {
    const problems = checkPlan({ ...conforming, issues: [] })
    assert.equal(problems.length, 1)
    assert.match(problems[0].message, /no linked issue/)
  })

  it('refuses a published change with no milestone, and names the current one', () => {
    const problems = checkPlan({ ...conforming, milestone: null })
    assert.equal(problems.length, 1)
    assert.match(problems[0].message, /0\.25\.0/)
  })

  it('refuses a later milestone, because it would ride along in this release', () => {
    const problems = checkPlan({ ...conforming, milestone: '0.26.0' })
    assert.equal(problems.length, 1)
    assert.match(problems[0].message, /put it in 0\.25\.0/)
  })

  it('carries a code per problem, so a host can offer the right help', () => {
    const problems = checkPlan({
      ...conforming,
      files: ['packages/menu/src/index.js'],
      milestone: null,
      issues: [],
    })
    assert.deepEqual(problems.map((p) => p.code).sort(), ['no-changeset', 'no-issue', 'no-milestone'])
  })

  it('names the current milestone on the problem, so help can pre-fill it', () => {
    const [problem] = checkPlan({ ...conforming, milestone: null })
    assert.equal(problem.current, '0.25.0')
  })

  it('names it on the missing-issue problem too, so the new issue lands on it', () => {
    const [problem] = checkPlan({ ...conforming, issues: [] })
    assert.equal(problem.code, 'no-issue')
    assert.equal(problem.current, '0.25.0')
  })

  it('reports every problem at once rather than one per run', () => {
    const problems = checkPlan({
      ...conforming,
      files: ['packages/menu/src/index.js'],
      milestone: null,
      issues: [],
    })
    assert.equal(problems.length, 3)
  })
})

describe('helpFor', () => {
  const ctx = {
    repoUrl: 'https://github.com/druxt/druxt.js',
    title: 'fix: a thing',
    body: 'why',
    number: '42',
  }

  it('tells you the command for a missing changeset', () => {
    assert.match(helpFor({ code: 'no-changeset' }, { ...ctx, host: 'github' }), /yarn changeset/)
  })

  it('pre-fills the issue, on the right milestone, for GitHub', () => {
    const help = helpFor({ code: 'no-issue', current: '0.25.0' }, { ...ctx, host: 'github' })
    assert.match(help, /issues\/new\?title=fix%3A\+a\+thing|issues\/new\?title=fix%3A%20a%20thing/)
    assert.match(help, /milestone=0\.25\.0/)
  })

  it('uses GitLab’s own query shape', () => {
    const help = helpFor(
      { code: 'no-issue', current: '0.25.0' },
      { ...ctx, host: 'gitlab', repoUrl: 'http://example/druxt/druxt.js', milestoneId: '7' }
    )
    assert.match(help, /\/-\/issues\/new\?issue\[title\]=/)
    assert.match(help, /issue\[milestone_id\]=7/)
  })

  it('points at the right place to set a milestone, per host', () => {
    assert.match(helpFor({ code: 'no-milestone', current: '0.25.0' }, { ...ctx, host: 'github' }), /\/pull\/42/)
    assert.match(
      helpFor({ code: 'no-milestone', current: '0.25.0' }, { ...ctx, host: 'gitlab' }),
      /\/-\/merge_requests\/42\/edit/
    )
  })

  it('says what to do when no milestone matches the line at all', () => {
    assert.match(helpFor({ code: 'no-milestone', current: null }, { ...ctx, host: 'github' }), /Create one/)
  })
})
