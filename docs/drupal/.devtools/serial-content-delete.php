<?php

/**
 * @file
 * First half of the serial `drush tome:import` replacement: clean slate.
 *
 * Run via `drush php-script` before config:import. Deletes the content the
 * profile install created (demo_umami ships demo content) so config:import
 * can drop and reshape bundles, and copies system.site and the default
 * language from sync into active config first - a fresh install generates
 * its own site UUID, and config:import refuses to run over a UUID mismatch.
 * The same preparation tome:import performs, in one process.
 */

use Drupal\Core\Entity\ContentEntityTypeInterface;
use Drupal\tome_sync\ImporterInterface;

$state = \Drupal::state();
$sync = \Drupal::service('config.storage.sync');
$config_factory = \Drupal::configFactory();
$entity_type_manager = \Drupal::entityTypeManager();

// Suppresses tome_sync's export-on-save handlers throughout; the import
// half unsets it when everything is back.
$state->set(ImporterInterface::STATE_KEY_IMPORTING, TRUE);

if ($site = $sync->read('system.site')) {
  $config_factory->getEditable('system.site')->setData($site)->save(TRUE);
  if (!empty($site['default_langcode']) && ($language = $sync->read('language.entity.' . $site['default_langcode']))) {
    $config_factory->getEditable('language.entity.' . $site['default_langcode'])->setData($language)->save(TRUE);
  }
}

foreach ($entity_type_manager->getDefinitions() as $entity_type) {
  if (!$entity_type instanceof ContentEntityTypeInterface) {
    continue;
  }
  $storage = $entity_type_manager->getStorage($entity_type->id());
  $ids = $storage->getQuery()->accessCheck(FALSE)->execute();
  foreach (array_chunk($ids, 50) as $chunk) {
    $storage->delete($storage->loadMultiple($chunk));
  }
}

print "Content cleared; site identity aligned with sync.\n";
