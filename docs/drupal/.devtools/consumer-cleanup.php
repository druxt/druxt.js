<?php

/**
 * @file
 * Keep exactly one OAuth consumer: the Druxt examples consumer.
 *
 * The consumers module's hook_install() creates a 'Default Consumer' with a
 * random UUID every time it is installed. Committing that entity to content/
 * would churn on each provision, so it is deleted instead — the committed
 * Druxt consumer (content/consumer.*.json) is the only one kept.
 */

$druxt_client_id = 'c6e3275c-05cb-45f0-a3c3-c037bf730963';

$storage = \Drupal::entityTypeManager()->getStorage('consumer');
foreach ($storage->loadMultiple() as $consumer) {
  if ($consumer->get('client_id')->value !== $druxt_client_id) {
    $consumer->delete();
    print 'Deleted consumer: ' . $consumer->label() . "\n";
  }
}

$count = $storage->getQuery()->accessCheck(FALSE)->count()->execute();
if ($count !== 1) {
  throw new Exception(sprintf('Expected exactly 1 consumer after cleanup, found %d.', $count));
}
print 'Consumer count: ' . $count . "\n";
