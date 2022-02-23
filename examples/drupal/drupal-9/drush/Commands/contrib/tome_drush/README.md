# tome_drush

This repository contains global Drush commands which make installing and
initializing Tome easier. These commands are not required to use Tome, which is
why they are included in a separate repository.

## Commands

### tome:install

Installs Drupal using the profile defined in your exported config, then
installs Tome and runs an import.

### tome:init

Prompts the user to choose an profile to install, then installs Tome and runs
an export. You should only run this once when starting a new project.
