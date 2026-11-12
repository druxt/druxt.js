import { pascalCase, splitByCase } from 'scule'
import type { DruxtComponentOptionSets } from './types'

/**
 * A candidate wrapper component: its name, naming parts, and whether it is registered.
 *
 * @example @lang js
 * { global: true, name: 'DruxtRouterEntityFront', parts: ['Entity', 'Front'] }
 */
export interface ComponentCandidate {
  global: boolean
  name: string
  parts: string[]
}

/**
 * A module's wrapper candidates, most specific first. Each option set adds a
 * name per part, built on the parts before it, with a langcode variant of
 * each when a language is set.
 *
 * @param moduleName - The module's component name, such as DruxtEntity.
 * @param sets - The module's `componentOptions`.
 * @param lang - The current language code.
 * @param isRegistered - Whether a component is registered under a name.
 */
export const getModuleComponents = (moduleName: string, sets: DruxtComponentOptionSets, lang: string | undefined, isRegistered: (name: string) => boolean): ComponentCandidate[] => {
  const components: ComponentCandidate[] = []
  for (const set of sets.filter((s): s is Array<string | null | undefined | false> => Array.isArray(s))) {
    const variants: { name: string, parts: string[] }[] = []
    for (const item of set.filter((o): o is string => !!o)) {
      const parts = variants.length ? [...variants[0]!.parts] : []
      parts.push(pascalCase(splitByCase(item)))
      const name = pascalCase([moduleName, ...parts].filter((part): part is string => !!part))
      variants.unshift({ name, parts })

      if (lang) {
        const langcodeName = pascalCase([moduleName, ...parts, lang].filter((part): part is string => !!part))
        components.push({ global: isRegistered(langcodeName), name: langcodeName, parts: [...parts, lang] })
      }
      components.push({ global: isRegistered(name), name, parts })
    }
  }

  const seen = new Set<string>()
  return components
    .filter((o) => !seen.has(o.name) && !!seen.add(o.name))
    .sort((a, b) => b.parts.length - a.parts.length)
}
