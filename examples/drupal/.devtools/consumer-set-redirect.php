<?php

/**
 * @file
 * Point the committed Druxt consumer's OAuth redirect at this run's tunnel.
 *
 * @nuxtjs/auth-next computes redirect_uri from the current page's own
 * origin when none is configured, so Content Ops Console's login works
 * from any origin the frontend happens to be served from - as long as
 * Drupal has that exact URI registered too. The consumer's `redirect`
 * field is single-value (its edit form renders exactly one input, no "add
 * another item" button), so appending a second value and saving silently
 * drops it - Drupal's field storage keeps only as many deltas as the
 * field's cardinality allows. This overwrites the one value instead,
 * safe here because the CI preview job's SQLite database is thrown away
 * every run; local dev never sets CONSUMER_REDIRECT_URI, so the committed
 * localhost:3004 value is untouched outside CI. Reads the URI from the
 * CONSUMER_REDIRECT_URI env var.
 */

$redirect_uri = getenv('CONSUMER_REDIRECT_URI');
if (!$redirect_uri) {
  throw new Exception('CONSUMER_REDIRECT_URI is not set.');
}

$druxt_client_id = 'c6e3275c-05cb-45f0-a3c3-c037bf730963';

$storage = \Drupal::entityTypeManager()->getStorage('consumer');
$consumers = $storage->loadByProperties(['client_id' => $druxt_client_id]);
$consumer = reset($consumers);
if (!$consumer) {
  throw new Exception('Druxt consumer not found.');
}

$consumer->set('redirect', $redirect_uri);
$consumer->save();
print 'Set OAuth redirect: ' . $redirect_uri . "\n";
