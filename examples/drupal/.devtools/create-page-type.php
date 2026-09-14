<?php

/**
 * @file
 * Creates the basic Page node type with a body field.
 *
 * Umami ships only Article and Recipe; the documented DruxtSchemaMixin
 * example targets node--page, and schema generation needs the type and a
 * body field placed on a display to produce the expected field config.
 */

use Drupal\field\Entity\FieldConfig;
use Drupal\node\Entity\NodeType;

if (!NodeType::load('page')) {
  NodeType::create([
    'type' => 'page',
    'name' => 'Basic page',
    'description' => 'Create a standalone page of static content.',
  ])->save();
  print 'Created the basic page node type.' . PHP_EOL;
}
else {
  print 'Basic page node type already exists.' . PHP_EOL;
}

if (\Drupal\field\Entity\FieldStorageConfig::loadByName('node', 'body') === NULL) {
  \Drupal\field\Entity\FieldStorageConfig::create([
    'field_name' => 'body',
    'entity_type' => 'node',
    'type' => 'text_with_summary',
    'settings' => [],
  ])->save();
  print 'Created the shared node body field storage.' . PHP_EOL;
}

if (!FieldConfig::loadByName('node', 'page', 'body')) {
  FieldConfig::create([
    'field_name' => 'body',
    'entity_type' => 'node',
    'bundle' => 'page',
    'label' => 'Body',
    'settings' => ['display_summary' => TRUE],
  ])->save();

  \Drupal::service('entity_display.repository')->getFormDisplay('node', 'page', 'default')
    ->setComponent('body', ['type' => 'text_textarea_with_summary'])
    ->save();
  \Drupal::service('entity_display.repository')->getViewDisplay('node', 'page', 'default')
    ->setComponent('body', ['type' => 'text_default'])
    ->save();
  print 'Body field added to Basic page with default display placement.' . PHP_EOL;
}
else {
  print 'Body field already present on Basic page.' . PHP_EOL;
}
