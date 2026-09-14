<?php

/**
 * @file
 * Create the public PKCE OAuth consumer the frontend examples expect.
 *
 * The UUID and client_id are fixed: examples/druxt-site and
 * examples/druxt-bootstrapvue hardcode the client_id in nuxt.config.js, and
 * the OAuth redirect must be http://localhost:3004/callback (the Content Ops
 * Console's dev port) or druxt-auth's authorization round-trip dies with
 * "invalid redirect" before any test can log in.
 *
 * These are the same values the druxtjs.org site backend provisions.
 */

$storage = \Drupal::entityTypeManager()->getStorage('consumer');

$consumer = $storage->load('e7043528-3e7c-44b1-9a78-6b05bc888698');
if ($consumer === NULL) {
  $values = [
    'uuid' => 'e7043528-3e7c-44b1-9a78-6b05bc888698',
    'client_id' => 'c6e3275c-05cb-45f0-a3c3-c037bf730963',
    'label' => 'Druxt',
    'description' => 'Public PKCE consumer for the Druxt frontend examples.',
    'is_default' => TRUE,
    'third_party' => FALSE,
    'confidential' => FALSE,
    'pkce' => TRUE,
    'redirect' => 'http://localhost:3004/callback',
  ];
  $consumer = $storage->create($values);
  $consumer->save();
  print 'Created consumer: ' . $consumer->label() . "\n";
}
else {
  print 'Consumer already present: ' . $consumer->label() . "\n";
}

// The Consumers module's hook_install() also creates a 'Default Consumer'
// with a random UUID and client_id - delete any strays so exactly one
// consumer remains.
foreach ($storage->loadMultiple() as $other) {
  if ($other->get('client_id')->value !== 'c6e3275c-05cb-45f0-a3c3-c037bf730963') {
    $other->delete();
    print 'Deleted stray consumer: ' . $other->label() . "\n";
  }
}

$count = $storage->getQuery()->accessCheck(FALSE)->count()->execute();
if ($count !== 1) {
  throw new Exception(sprintf('Expected exactly 1 consumer, found %d.', $count));
}
print 'Consumer count: ' . $count . "\n";
