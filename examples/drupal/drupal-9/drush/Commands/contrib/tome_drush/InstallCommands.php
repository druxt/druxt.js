<?php

namespace Drush\Commands\tome_drush;

use Drupal\Component\FileCache\FileCacheFactory;
use Drupal\Core\Config\FileStorage;
use Drupal\Core\Extension\InfoParserDynamic;
use Drupal\Core\Site\Settings;
use Drush\Commands\DrushCommands;
use Drush\Drupal\ExtensionDiscovery;
use Drush\Drush;
use Consolidation\SiteAlias\SiteAliasManagerAwareTrait;
use Consolidation\SiteAlias\SiteAliasManagerAwareInterface;

/**
 * Contains install and init commands for tome.
 */
class InstallCommands extends DrushCommands implements SiteAliasManagerAwareInterface {

  use SiteAliasManagerAwareTrait;

  /**
   * Installs tome.
   *
   * @bootstrap configuration
   * @command tome:install
   *
   * @return int|null
   *   The status code, if the command did not complete successfully.
   */
  public function install() {
    if (!$this->io()->confirm('You are about to DROP all tables in your local database and re-install Tome. Do you want to continue?', FALSE)) {
      return 0;
    }

    FileCacheFactory::setConfiguration(['default' => ['class' => '\Drupal\Component\FileCache\NullFileCache']]);
    $source_storage = new FileStorage(Settings::get('config_sync_directory'));

    if (!$source_storage->exists('core.extension')) {
      $this->io()->warning('Existing configuration to install from not found. If this is your first time using Tome try running "drush tome:init".');
      return 1;
    }

    $config = $source_storage->read('core.extension');

    $self = $this->siteAliasManager()->getSelf();
    Drush::drush($self, 'site-install', [$config['profile']], ['yes' => TRUE, 'sites-subdir' => 'default'])->mustRun();
    if (isset($config['module']['tome_sync'])) {
      Drush::drush($self, 'pm:enable', ['tome_sync'], ['yes' => TRUE])->mustRun();
    }
    else {
      Drush::drush($self, 'pm:enable', ['tome'], ['yes' => TRUE])->mustRun();
    }
    Drush::drush($self, 'tome:import', [], ['yes' => TRUE])->mustRun();
    Drush::drush($self, 'cache:rebuild', [], ['yes' => TRUE])->mustRun();

    $this->io()->success('Install complete!');
  }

  /**
   * Initializes tome.
   *
   * @bootstrap configuration
   * @command tome:init
   *
   * @return int|null
   *   The status code, if the command did not complete successfully.
   */
  public function init() {
    if (is_dir(Settings::get('config_sync_directory')) || is_dir(Settings::get('tome_content_directory', '../content'))) {
      if (!$this->io()->confirm('Running this command will remove all exported content and configuration. Do you want to continue?', FALSE)) {
        return 0;
      }
    }

    $profiles = $this->getProfiles();
    $profile = $this->io()->choice('Select an installation profile', $profiles);

    $self = $this->siteAliasManager()->getSelf();
    Drush::drush($self, 'site-install', [$profile], ['yes' => TRUE, 'sites-subdir' => 'default'])->mustRun();
    Drush::drush($self, 'pm:enable', ['tome'], ['yes' => TRUE])->mustRun();
    Drush::drush($self, 'tome:export', [], ['yes' => TRUE])->mustRun();

    $this->io()->success('Initialization complete!');
  }

  /**
   * Gets a list of profiles.
   *
   * @return string[]
   *   An array of profile descriptions keyed by the profile machine name.
   */
  protected function getProfiles() {
    // Build a list of all available profiles.
    $listing = new ExtensionDiscovery(getcwd(), FALSE);
    $listing->setProfileDirectories([]);
    $profiles = [];
    $info_parser = new InfoParserDynamic();
    foreach ($listing->scan('profile') as $profile) {
      $details = $info_parser->parse($profile->getPathname());
      // Don't show hidden profiles.
      if (!empty($details['hidden'])) {
        continue;
      }
      // Determine the name of the profile; default to the internal name if none
      // is specified.
      $name = isset($details['name']) ? $details['name'] : $profile->getName();
      $description = isset($details['description']) ? "$name - {$details['description']}" : $name;
      $profiles[$profile->getName()] = $description;
    }
    natcasesort($profiles);
    return $profiles;
  }

}
