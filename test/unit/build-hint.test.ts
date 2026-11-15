import { describe, expect, it } from 'vitest'
import { DruxtPermissionsError } from '@druxt/client'
import { buildCredentialsHint } from '../../packages/core/src/module'

// What a build reading restricted displays fails with: Drupal omitted them, and named the permission.
const omitted = new DruxtPermissionsError('Some resources have been omitted because of insufficient authorization.', ['administer display modes'])

describe('buildCredentialsHint()', () => {
  it('names the credentials and the scope when the build has no credentials', () => {
    const hint = buildCredentialsHint({}, omitted)
    expect(hint).toContain('DRUXT_BUILD_CLIENT_ID with DRUXT_BUILD_CLIENT_SECRET')
    expect(hint).toContain('DRUXT_BUILD_USERNAME and DRUXT_BUILD_PASSWORD')
    expect(hint).toContain('DRUXT_BUILD_SCOPE')
  })

  it('names the missing scope when the build has credentials and no scope, and says that is likely why Drupal omitted resources', () => {
    const hint = buildCredentialsHint({ clientId: 'build', username: 'bot', password: 'pw' }, omitted)
    expect(hint).toContain('likely for a missing scope')
    expect(hint).toContain('carries no roles unless a scope is requested')
    expect(hint).toContain('DRUXT_BUILD_SCOPE')
    expect(hint).not.toContain('DRUXT_BUILD_CLIENT_SECRET')
    // Without an omission, it still names the scope.
    expect(buildCredentialsHint({ clientId: 'build', clientSecret: 'secret' })).toContain('DRUXT_BUILD_SCOPE')
  })

  it('names the scope\'s roles when the build has credentials and a scope and Drupal still omitted resources, and nothing otherwise', () => {
    const auth = { clientId: 'build', clientSecret: 'secret', scope: 'druxt_build' }
    expect(buildCredentialsHint(auth, omitted)).toBe('Drupal omitted resources from the build: check that the scope \'druxt_build\' grants a role with the permissions Drupal names.')
    expect(buildCredentialsHint(auth)).toBe('')
    expect(buildCredentialsHint(auth, new Error('fetch failed'))).toBe('')
  })

  it('leaves Drupal\'s list of required permissions in the error it is logged beside', () => {
    expect(omitted.message).toContain('Required permissions:\n - administer display modes')
  })
})
