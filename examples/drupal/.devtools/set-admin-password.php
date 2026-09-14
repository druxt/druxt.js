<?php

/**
 * @file
 * Set the admin (uid 1) account's password to a known value, so the
 * Content Ops Console example's "Test login: admin / druxt123" hint works.
 */

$account = \Drupal\user\Entity\User::load(1);
if (!$account) {
  throw new Exception('Expected uid 1 (admin) to exist after site-install.');
}

$account->setPassword('druxt123');
$account->save();

print 'Set admin (uid 1) password.' . "\n";
