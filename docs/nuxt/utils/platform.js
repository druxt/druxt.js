/**
 * The search shortcut label for the current platform.
 *
 * Shared because the header and the sidebar both advertise it and had drifted:
 * the header detected the platform while the sidebar hard-coded `⌘K`, so on a
 * non-Mac both were on screen together at >=1024px showing different keys for
 * the same shortcut.
 *
 * Must be called client-side only - it reads `navigator`, so components use it
 * from `mounted()` and start from the default below during SSR.
 */
export const MAC_SHORTCUT = '⌘K'

/**
 * @returns {string} `⌘K` on Apple platforms, `Ctrl K` everywhere else.
 */
export const searchShortcut = () => {
  // navigator.platform is deprecated; userAgentData is the replacement and
  // this falls back for browsers that don't implement it yet.
  const platform = (typeof navigator !== 'undefined'
    && (navigator.userAgentData?.platform || navigator.platform)) || ''
  return /Mac|iPod|iPhone|iPad/.test(platform) ? MAC_SHORTCUT : 'Ctrl K'
}
