<?php

/**
 * @file
 * Add Spanish as a prefixed secondary language.
 *
 * demo_umami ships English-only content. The examples exercise /es routing
 * (decoupled_router path-prefix resolution); with es enabled at the /es
 * prefix, the language-neutral front page and recipes listing serve under
 * /es without translated demo content. The full multilingual backend with
 * translated content lives in the druxtjs.org site backend.
 */

use Drupal\language\Entity\ConfigurableLanguage;

if (ConfigurableLanguage::load('es') === NULL) {
  ConfigurableLanguage::createFromLangcode('es')->save();
  print 'Created Spanish language.' . "\n";
}
else {
  print 'Spanish language already present.' . "\n";
}

// Prefix-based negotiation for path-prefixed URLs like /es/recipes.
\Drupal::configFactory()->getEditable('language.negotiation')
  ->set('url.source', 'path_prefix')
  ->set('url.prefixes', ['en' => '', 'es' => 'es'])
  ->save();

// Rebuild routes so the /es prefix takes effect immediately.
\Drupal::service('router.builder')->rebuild();

print 'URL negotiation: path prefix (en: <none>, es: es).' . "\n";
