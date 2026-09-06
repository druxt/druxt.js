<?php

/**
 * @file
 * Second half of the serial `drush tome:import` replacement.
 *
 * Run via `drush php-script` after config:import. Imports every content
 * entity from the Tome store inside this one bootstrapped process - no
 * child drush processes, so nothing races SQLite's single writer - then
 * dispatches the same import-complete event `drush tome:import` ends with.
 */

use Drupal\Component\EventDispatcher\Event;
use Drupal\tome_sync\Event\TomeSyncEvents;
use Drupal\tome_sync\ImporterInterface;
use Drupal\tome_sync\TomeSyncHelper;

$state = \Drupal::state();
$importer = \Drupal::service('tome_sync.importer');

// Import every content entity from the store, in dependency order.
foreach ($importer->getChunkedNames() as $chunk) {
  foreach ($chunk as $name) {
    [$entity_type_id, $uuid, $langcode] = TomeSyncHelper::getPartsFromContentName($name);
    $importer->importContent($entity_type_id, $uuid, $langcode);
  }
}

$importer->importFiles();

$state->set(ImporterInterface::STATE_KEY_IMPORTING, FALSE);

// What `drush tome:import-complete` dispatches.
\Drupal::service('event_dispatcher')->dispatch(new Event(), TomeSyncEvents::IMPORT_ALL);

print "Serial content import complete.\n";
