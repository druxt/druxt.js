<?php

/**
 * @file
 * Set the admin (uid 1) account's password to a known value.
 *
 * Tome imports the committed content export's user entities with their
 * original (unknown) password hashes, so nobody actually knows uid 1's
 * password after a fresh provision - the Content Ops Console example's
 * "Test login: admin / druxt123" hint would never work without this.
 */

$account = \Drupal\user\Entity\User::load(1);
if (!$account) {
  throw new Exception('Expected uid 1 (admin) to exist after tome:install.');
}

$account->setPassword('druxt123');
$account->save();

print 'Set admin (uid 1) password.' . "\n";
