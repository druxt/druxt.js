<?php

/**
 * @file
 * Single-process `drush config:import` replacement.
 *
 * Run via `drush php-script`. When core.extension changes, drush processes
 * the module install batch in a nested drush process
 * (drush_backend_batch_process()), and on slow CI disks that child deadlocks
 * against its parent's SQLite locks and dies as 'database is locked'.
 * Core's ConfigImporter runs every step synchronously when called directly,
 * module installs included, so this stays one process the whole way.
 */

use Drupal\Core\Config\ConfigImporter;
use Drupal\Core\Config\ConfigImporterException;
use Drupal\Core\Config\StorageComparer;

$storage_comparer = new StorageComparer(
  \Drupal::service('config.storage.sync'),
  \Drupal::service('config.storage')
);

if (!$storage_comparer->createChangelist()->hasChanges()) {
  print "No configuration changes to import.\n";
  return;
}

$config_importer = new ConfigImporter(
  $storage_comparer,
  \Drupal::service('event_dispatcher'),
  \Drupal::service('config.manager'),
  \Drupal::service('lock'),
  \Drupal::service('config.typed'),
  \Drupal::service('module_handler'),
  \Drupal::service('module_installer'),
  \Drupal::service('theme_handler'),
  \Drupal::service('string_translation'),
  \Drupal::service('extension.list.module'),
  \Drupal::service('extension.list.theme')
);

try {
  $config_importer->import();
}
catch (ConfigImporterException $e) {
  print $e->getMessage() . "\n";
  foreach ($config_importer->getErrors() as $error) {
    print "  - " . strip_tags((string) $error) . "\n";
  }
  throw $e;
}

print "Configuration imported in one process.\n";
