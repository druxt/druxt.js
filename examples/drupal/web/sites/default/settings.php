<?php

/**
 * @file
 * Minimal settings for the examples backend.
 *
 * All real configuration lives in settings.local.php, written fresh by
 * .devtools/provision (gitignored). Under DDEV the same file is used —
 * the SQLite database is deliberate: every provision is throwaway.
 */

// @codingStandardsIgnoreFile

// Default database, used only when settings.local.php is absent (it is
// written fresh by every .devtools/provision run). The local file must be
// included AFTER this assignment or its database wins nothing.
$databases['default']['default'] = array (
  'database' => '/tmp/druxtjs-examples-backend.sqlite',
  'prefix' => '',
  'driver' => 'sqlite',
  'namespace' => 'Drupal\\sqlite\\Driver\\Database\\sqlite',
  'autoload' => 'core/modules/sqlite/src/Driver/Database/sqlite/',
);
if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
  include $app_root . '/' . $site_path . '/settings.local.php';
}
$settings['hash_salt'] = 'LtxXAhxcyE8HnruD9HnMNGNlhI2P1ucshgbhFbsH-yUa3TZGdnS64SydUbYEy4fa0rLj-2UxIg';
$settings['config_sync_directory'] = 'sites/default/files/config_BMpxR41L6QP9CqBOhGD6ugQZb2kOVmL3YLjEdJWw1jwKwGYnHnV7Oj5Lr4Vt6eP1I7mI36FT8g/sync';
