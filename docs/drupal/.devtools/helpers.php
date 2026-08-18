<?php

/**
 * @file
 * Shared helper functions for docs/drupal's DevTools scripts.
 *
 * In the spirit of AlexSkrypnyk/drupal_extension_scaffold, but for a
 * full site checkout rather than a bare extension: no `build/` directory,
 * no `composer create-project` scaffolding step — `docs/drupal` already IS
 * the site codebase, so `assemble` is just `composer install` and
 * `provision` runs `drush tome:install` against the committed
 * config/content instead of a vanilla `site-install`.
 *
 * The custom-script extension point (`scripts/<prefix>-*.sh` hooks) from
 * the reference pattern is intentionally not included here — nothing in
 * this site currently needs it. Add it if/when something does.
 *
 * @phpcs:disable Drupal.NamingConventions.ValidFunctionName.InvalidName
 */

declare(strict_types=1);

namespace DruxtjsDevTools;

/**
 * Get environment variable with fallback and default value.
 */
function getenv_default(mixed ...$vars): string {
  if (count($vars) < 2) {
    throw new \InvalidArgumentException('getenv_default() requires at least 2 arguments: one or more variable names and a default value');
  }

  $default = array_pop($vars);

  foreach ($vars as $var) {
    $value = is_string($var) ? getenv($var) : $default;
    if ($value !== FALSE && is_string($value) && $value !== '') {
      return $value;
    }
  }

  return is_string($default) ? $default : '';
}

/**
 * Read variables from a dotenv-style file into an associative array.
 *
 * Parses lines of the form KEY=VALUE. Lines that are blank or start with
 * '#' (after optional whitespace) are ignored. Surrounding single or double
 * quotes around the value are stripped. Keys and values are trimmed.
 *
 * @param string $file
 *   Path to the dotenv file.
 *
 * @return array<string, string>
 *   Associative array of key-value pairs. Empty if the file does not exist
 *   or contains no parseable lines.
 */
function dotenv_read(string $file = '.env'): array {
  if (!file_exists($file)) {
    return [];
  }

  $contents = file_get_contents($file);
  if ($contents === FALSE) {
    return [];
  }

  $vars = [];
  foreach (preg_split('/\r\n|\r|\n/', $contents) ?: [] as $line) {
    $trimmed = trim($line);
    if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
      continue;
    }

    [$key, $value] = explode('=', $trimmed, 2);
    $key = trim($key);
    $value = trim($value);

    if ($key === '') {
      continue;
    }

    if (strlen($value) >= 2) {
      $first = $value[0];
      $last = $value[strlen($value) - 1];
      if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
        $value = substr($value, 1, -1);
      }
    }

    $vars[$key] = $value;
  }

  return $vars;
}

/**
 * Set or update a variable in a dotenv-style file.
 *
 * If the key already exists in the file, its line is rewritten in place,
 * preserving the order of other lines and any comments or blank lines.
 * If the key does not exist, the assignment is appended to the end of the
 * file. The file is created with the single assignment if it does not exist.
 */
function dotenv_write_var(string $key, string $value, string $file = '.env'): void {
  $assignment = sprintf('%s=%s', $key, $value);

  if (!file_exists($file)) {
    if (file_put_contents($file, $assignment . PHP_EOL) === FALSE) {
      FAIL('Unable to write %s', $file);
    }

    return;
  }

  $contents = file_get_contents($file);
  if ($contents === FALSE) {
    FAIL('Unable to read %s', $file);

    // @codeCoverageIgnoreStart
    return;
    // @codeCoverageIgnoreEnd
  }

  $lines = preg_split('/\r\n|\r|\n/', $contents) ?: [];
  $trailing_newline = $contents !== '' && (str_ends_with($contents, "\n") || str_ends_with($contents, "\r"));
  if ($trailing_newline && end($lines) === '') {
    array_pop($lines);
  }

  $replace_index = NULL;
  foreach ($lines as $i => $line) {
    $trimmed = trim($line);
    if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
      continue;
    }

    [$existing_key] = explode('=', $trimmed, 2);
    if (trim($existing_key) === $key) {
      $replace_index = $i;
    }
  }

  if ($replace_index === NULL) {
    $lines[] = $assignment;
  }
  else {
    $lines[$replace_index] = $assignment;
  }

  if (file_put_contents($file, implode(PHP_EOL, $lines) . PHP_EOL) === FALSE) {
    FAIL('Unable to write %s', $file);
  }
}

/**
 * Resolve an environment value from env, then dotenv, then default.
 *
 * @return array{0: string, 1: string}
 *   Tuple of [value, source].
 */
function resolve_env_value(string $name, string $default, string $dotenv_file = '.env'): array {
  $env = getenv($name);
  if ($env !== FALSE && $env !== '') {
    return [$env, 'env'];
  }

  $dotenv = dotenv_read($dotenv_file);
  if (isset($dotenv[$name]) && $dotenv[$name] !== '') {
    return [$dotenv[$name], $dotenv_file];
  }

  return [$default, 'default'];
}

/**
 * Resolve the webserver host and port with source tracking.
 *
 * @return array{host: string, host_source: string, port: string, port_source: string}
 */
function resolve_webserver(bool $auto_discover = FALSE, bool $validate_port = TRUE, string $dotenv_file = '.env'): array {
  [$host, $host_source] = resolve_env_value('WEBSERVER_HOST', '127.0.0.1', $dotenv_file);

  $default_port = $auto_discover ? '' : '8888';
  [$port, $port_source] = resolve_env_value('WEBSERVER_PORT', $default_port, $dotenv_file);

  if ($auto_discover && $port_source === 'default') {
    $port = (string) find_free_port();
    dotenv_write_var('WEBSERVER_PORT', $port, $dotenv_file);
    $port_source = $dotenv_file;
  }

  if ($validate_port) {
    validate_port_or_fail($port, 'WEBSERVER_PORT');
  }

  return [
    'host' => $host,
    'host_source' => $host_source,
    'port' => $port,
    'port_source' => $port_source,
  ];
}

/**
 * Detect the XDebug state of the dev server listening on the given port.
 */
function xdebug_state(string $port): string {
  $cmd = sprintf('ps -o command= -p "$(lsof -ti:%s 2>/dev/null | head -1)" 2>/dev/null', escapeshellarg($port));
  $out = trim((string) @shell_exec($cmd));
  if ($out === '') {
    return '-';
  }

  return str_contains($out, 'xdebug.mode=debug') ? 'enabled' : 'disabled';
}

/**
 * Validate that a value is a TCP port in the range 1-65535.
 */
function validate_port_or_fail(string $value, string $source): void {
  if (!ctype_digit($value) || (int) $value < 1 || (int) $value > 65535) {
    FAIL('Invalid %s "%s". Expected integer in range 1-65535.', $source, $value);
  }
}

/**
 * Find a free TCP port by scanning a range of ports.
 */
function find_free_port(int $start = 8888, int $max_attempts = 100): int {
  if ($start < 1 || $start > 65535) {
    FAIL('Start port must be between 1 and 65535, got %d', $start);
  }
  if ($max_attempts < 1) {
    FAIL('Max attempts must be a positive integer, got %d', $max_attempts);
  }

  for ($port = $start; $port < $start + $max_attempts; $port++) {
    $conn = @stream_socket_client(sprintf('tcp://localhost:%d', $port), $errno, $errstr, 0.2);
    if ($conn === FALSE) {
      return $port;
    }
    fclose($conn);
  }

  FAIL('Unable to find a free port in range %d-%d', $start, $start + $max_attempts - 1);

  // @codeCoverageIgnoreStart
  return $start;
  // @codeCoverageIgnoreEnd
}

/**
 * Output a note message.
 */
function NOTE(string $format, string|int|float ...$args): void {
  echo sprintf('       %s%s', sprintf($format, ...$args), PHP_EOL);
}

/**
 * Output a task message.
 */
function TASK(string $format, string|int|float ...$args): void {
  echo term_supports_color() ?
    "\033[34m[TASK] " . sprintf($format, ...$args) . "\033[0m\n" :
    sprintf('[TASK] %s%s', sprintf($format, ...$args), PHP_EOL);
}

/**
 * Output an info message.
 */
function INFO(string $format, string|int|float ...$args): void {
  echo term_supports_color() ?
    "\033[36m[INFO] " . sprintf($format, ...$args) . "\033[0m\n" :
    sprintf('[INFO] %s%s', sprintf($format, ...$args), PHP_EOL);
}

/**
 * Output a success message.
 */
function PASS(string $format, string|int|float ...$args): void {
  echo term_supports_color() ?
    "\033[32m[ OK ] " . sprintf($format, ...$args) . "\033[0m\n" :
    sprintf('[ OK ] %s%s', sprintf($format, ...$args), PHP_EOL);
}

/**
 * Output a failure message and exit(1).
 */
function FAIL(string $format, string|int|float ...$args): void {
  FAIL_NO_EXIT($format, ...$args);
  quit(1);
}

/**
 * Output a failure message without exiting.
 */
function FAIL_NO_EXIT(string $format, string|int|float ...$args): void {
  echo term_supports_color() ?
    "\033[31m[FAIL] " . sprintf($format, ...$args) . "\033[0m\n" :
    sprintf('[FAIL] %s%s', sprintf($format, ...$args), PHP_EOL);
}

/**
 * Check if the terminal supports colors.
 */
function term_supports_color(): bool {
  return getenv('TERM') === 'dumb' || getenv('TERM') === FALSE ? FALSE : function_exists('posix_isatty') && @posix_isatty(STDOUT);
}

/**
 * Get the path to a command, or FALSE if the command does not exist.
 */
function command_path(string $command): string|false {
  if (!preg_match('/^[A-Za-z0-9_\-]+(?: [A-Za-z0-9_\-]+)*$/', $command)) {
    return FALSE;
  }
  exec(sprintf('command -v %s 2>/dev/null', $command), $output, $code);
  return $code === 0 && !empty($output[0]) ? trim($output[0]) : FALSE;
}

/**
 * Require a command to be available, or fail.
 */
function command_must_exist(string $command): void {
  if (!command_path($command)) {
    FAIL("Command '%s' is not available", $command);
  }
}

/**
 * Run a command via passthru, failing if exit code is non-zero.
 */
function passthru_or_fail(string $cmd, string $format = '', string|int|float ...$args): void {
  passthru($cmd, $exit_code);
  if ($exit_code !== 0) {
    if ($format !== '') {
      FAIL($format, ...$args);
    }
    quit($exit_code);
  }
}

/**
 * Run a drush command against this site's `web/` docroot.
 *
 * @param string $command
 *   The drush command, optionally with sprintf-style placeholders.
 * @param string|string[]|null $args
 *   Arguments to substitute into the command. Each is escaped with
 *   escapeshellarg() before substitution.
 * @param int|null &$exit_code
 *   If provided, the exit code is stored here and failures do not exit
 *   the script. If not provided, non-zero exit codes call FAIL().
 *
 * @param-out int $exit_code
 */
function drush(string $command, mixed $args = NULL, ?int &$exit_code = NULL): string {
  if (is_string($args)) {
    $args = [$args];
  }

  if (is_array($args) && $args !== []) {
    $command = sprintf($command, ...array_map(escapeshellarg(...), $args));
  }

  $exit_code_provided = $exit_code !== NULL;
  $exit_code = 0;

  // Drupal installs/imports can exceed PHP's default 128M memory_limit.
  // `-d memory_limit=-1` on this process alone isn't enough: `site-install`
  // (which `tome:install` calls internally) runs in its own child PHP
  // process via Drush's SiteProcess, which does not inherit the parent
  // process's `-d` flags. PHPRC does get inherited (it's an environment
  // variable, not a CLI flag), so route both the parent and any child
  // through the same uncapped php.ini.
  putenv('PHPRC=' . __DIR__ . '/etc/php.ini');
  $command = 'vendor/bin/drush -r ' . escapeshellarg(getcwd() . '/web') . ' -y ' . $command;

  ob_start();
  passthru($command, $exit_code);
  $output = ob_get_clean();

  if (!$exit_code_provided && $exit_code !== 0) {
    FAIL('Drush command failed: %s', $command);
  }

  return $output ?: '';
}

/**
 * Check if debug mode is enabled.
 */
function is_debug(): bool {
  return getenv('DEBUG') === '1';
}

// Never run the real quit() during tests.
// @codeCoverageIgnoreStart
if (!function_exists('DruxtjsDevTools\quit') && !class_exists('PHPUnit\\Framework\\TestCase')) {

  /**
   * Exit script with given code.
   */
  function quit(int $code = 0): void {
    exit($code);
  }

}
// @codeCoverageIgnoreEnd
