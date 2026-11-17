import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useState } from '#imports'
import { languages as built } from '#druxt/languages'

/** The Nuxt state that holds the site's languages, as the build read them. */
export const DRUXT_LANGUAGES_STATE = 'druxt:languages'

/** A Drupal language and the URL prefix it is served under. The prefix is empty for none. */
export interface DruxtSiteLanguage {
  langcode: string
  prefix: string
  /**
   * The language's label, as Drupal names it in its own language, such as `Spanish`.
   *
   * It is not the language's native name, such as `Español`. Drupal's configurable language holds none.
   */
  label?: string
}

/** What `useDruxtLanguages()` returns. */
export interface UseDruxtLanguages {
  /** The site's languages, each with its URL prefix. */
  languages: ComputedRef<DruxtSiteLanguage[]>
  /**
   * The langcode of the language served with no prefix, which is Drupal's default language.
   *
   * Undefined when every language is prefixed.
   */
  defaultLangcode: ComputedRef<string | undefined>
}

/**
 * Gets the site's languages and their URL prefixes, as the build read them from Drupal, and the default language.
 *
 * The default language is the one served with no prefix. A page at an unprefixed path is in that language, whatever
 * the langcode of the entity it shows.
 *
 * @example @lang ts
 * const { defaultLangcode } = useDruxtLanguages()
 * const lang = route.meta.langcode || defaultLangcode.value
 */
export const useDruxtLanguages = (): UseDruxtLanguages => {
  const state = useState<DruxtSiteLanguage[]>(DRUXT_LANGUAGES_STATE, () => built)
  return {
    languages: computed(() => state.value),
    defaultLangcode: computed(() => state.value.find((language) => language.prefix === '')?.langcode),
  }
}
