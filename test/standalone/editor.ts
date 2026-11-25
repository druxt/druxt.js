import { randomUUID } from 'node:crypto'
import { drush } from './drush'

const BASE_URL = process.env.DRUXT_BASE_URL || 'http://127.0.0.1:8888'

/** What a test's editor is called on the backend, and the page it makes. */
export interface TestEditorNames {
  /** The consumer's client id. */
  client: string
  /** The scope granting Umami's editor role. */
  scope: string
  /** The editor's user name. */
  editor: string
  /** The page's title. */
  title: string
  /** Whether the page is published. */
  published?: boolean
  /** Every node title the test may leave, removed on tear-down. */
  titles?: string[]
}

/**
 * A backend editor for a test: a user with Umami's editor role, a scope granting that role, and a confidential
 * consumer whose client credentials sign in as the user, so the test signs in without a browser. Then one page for the
 * test to read or edit. The consumer's secret is this run's own, never a fixed string in the repository. Everything it
 * makes is found by its names, so a set-up that failed part way is undone as well as one that ran.
 *
 * @param names - The consumer, scope, editor and page names.
 */
export const testEditor = (names: TestEditorNames) => {
  const secret = randomUUID()
  const titles = [names.title, ...(names.titles || [])]

  const setUp = (fail = false) => `
use Drupal\\simple_oauth\\Entity\\Oauth2Scope;
use Drupal\\simple_oauth\\Oauth2ScopeInterface;
$types = \\Drupal::entityTypeManager();
$users = $types->getStorage('user')->loadByProperties(['name' => '${names.editor}']);
$user = reset($users) ?: $types->getStorage('user')->create(['name' => '${names.editor}', 'mail' => '${names.editor}@example.invalid', 'status' => 1]);
$user->addRole('editor');
$user->save();
${fail ? "throw new \\RuntimeException('A forced set-up failure.');" : ''}
if (!Oauth2Scope::load('${names.scope}')) {
  Oauth2Scope::create(['id' => '${names.scope}', 'name' => '${names.scope}', 'description' => 'A Druxt test editor.', 'grant_types' => ['client_credentials' => ['status' => TRUE, 'description' => 'Sign in as the test editor.']], 'umbrella' => FALSE, 'granularity_id' => Oauth2ScopeInterface::GRANULARITY_ROLE, 'granularity_configuration' => ['role' => 'editor']])->save();
}
$consumers = $types->getStorage('consumer')->loadByProperties(['client_id' => '${names.client}']);
$consumer = reset($consumers) ?: $types->getStorage('consumer')->create(['client_id' => '${names.client}', 'label' => 'Druxt test editor']);
$consumer->set('secret', '${secret}');
$consumer->set('confidential', TRUE);
$consumer->set('grant_types', ['client_credentials']);
$consumer->set('scopes', [['scope_id' => '${names.scope}']]);
$consumer->set('user_id', $user->id());
$consumer->save();
$published = ${names.published === false ? 'FALSE' : 'TRUE'};
$node = $types->getStorage('node')->create(['type' => 'page', 'title' => '${names.title}', 'status' => $published ? 1 : 0, 'moderation_state' => $published ? 'published' : 'draft', 'uid' => 1]);
$node->save();
print json_encode(['uuid' => $node->uuid()]);
`

  const TEAR_DOWN = `
$types = \\Drupal::entityTypeManager();
foreach ($types->getStorage('node')->loadByProperties(['title' => ${JSON.stringify(titles).replace(/"/g, "'")}]) as $node) $node->delete();
foreach ($types->getStorage('consumer')->loadByProperties(['client_id' => '${names.client}']) as $consumer) $consumer->delete();
if ($scope = \\Drupal\\simple_oauth\\Entity\\Oauth2Scope::load('${names.scope}')) $scope->delete();
foreach ($types->getStorage('user')->loadByProperties(['name' => '${names.editor}']) as $user) $user->delete();
`

  const LEFT = `
$types = \\Drupal::entityTypeManager();
print json_encode([
  'users' => count($types->getStorage('user')->loadByProperties(['name' => '${names.editor}'])),
  'consumers' => count($types->getStorage('consumer')->loadByProperties(['client_id' => '${names.client}'])),
  'scopes' => \\Drupal\\simple_oauth\\Entity\\Oauth2Scope::load('${names.scope}') ? 1 : 0,
]);
`

  /** Undoes everything a set-up made. */
  const tearDown = () => drush(['php-eval', TEAR_DOWN])
  /** How many of the editor, its consumer and its scope the backend holds. */
  const left = () => JSON.parse(drush(['php-eval', LEFT]).split('\n').pop()!) as Record<string, number>

  /** The editor's access token, from the token endpoint. */
  const signIn = async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}/oauth/token`, {
      method: 'POST',
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: names.client, client_secret: secret, scope: names.scope }),
    })
    const body = await response.json() as { access_token?: string }
    if (!body.access_token) throw new Error(`The test editor could not sign in: ${response.status}`)
    return body.access_token
  }

  /**
   * Sets up the editor and the page, and signs in, undoing everything when any step fails, so no credential is left.
   *
   * @param fail - Whether the set-up fails after saving the user.
   */
  const prepare = async (fail = false): Promise<{ uuid: string, token: string }> => {
    try {
      const created = JSON.parse(drush(['php-eval', setUp(fail)]).split('\n').pop()!) as { uuid: string }
      return { uuid: created.uuid, token: await signIn() }
    } catch (err) {
      tearDown()
      throw err
    }
  }

  return { prepare, signIn, tearDown, left }
}
