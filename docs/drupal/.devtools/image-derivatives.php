<?php

/**
 * @file
 * Pre-generates image style derivatives for the demo content.
 *
 * Core's image controller requires an itok token on derivative URLs, which
 * JSON:API never exposes, so tokenless derivative paths only work when the
 * derivative file already exists and is served statically (the dev server's
 * .ht.router.php serves existing files before routing into Drupal, like any
 * try_files-style webserver). This generates every image file x druxt_* style
 * pair, so the frontend can link
 * /sites/default/files/styles/{style}/public/... directly.
 */

use Drupal\image\Entity\ImageStyle;

$style_ids = ['druxt_card_4_3', 'druxt_thumb_4_3'];

$styles = array_filter(array_map(
  static fn ($id) => ImageStyle::load($id),
  $style_ids
));

if (count($styles) !== count($style_ids)) {
  throw new Exception('One or more image styles are missing: ' . implode(', ', $style_ids));
}

$files = \Drupal::entityTypeManager()->getStorage('file');
$image_mimes = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];

$count = 0;
foreach ($files->loadMultiple() as $file) {
  if (!in_array($file->getMimeType(), $image_mimes, TRUE)) {
    continue;
  }
  $uri = $file->getFileUri();
  foreach ($styles as $style) {
    $derivative = $style->buildUri($uri);
    if (!file_exists($derivative)) {
      $style->createDerivative($uri, $derivative);
      $count++;
    }
  }
}

print "Generated {$count} image derivatives.\n";
