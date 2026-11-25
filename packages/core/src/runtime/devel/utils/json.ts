import { defineComponent, h, nextTick, reactive } from 'vue'
import type { PropType, VNode } from 'vue'
import { isTree, size } from './size'

// A string longer than `LONG` characters folds to its first `FOLDED_AT` characters, with a button for the rest.
const LONG = 80
const FOLDED_AT = 40

/**
 * JSON, indented and coloured, for DruxtDebug in development.
 *
 * These values fold to a button that expands them in place:
 *
 * - A string over 80 characters.
 * - An object or array past the second level.
 * - An object or array at the second level that holds another object or array.
 *
 * An expanded value keeps a button that folds it again. Focus stays on that value's button.
 */
export default defineComponent({
  name: 'DruxtDebugJson',
  props: { value: { type: null as unknown as PropType<unknown>, required: true } },
  setup(props) {
    const expanded = reactive(new Set<string>())
    const buttons = new Map<string, HTMLElement>()
    const toggle = async (path: string): Promise<void> => {
      if (expanded.has(path)) expanded.delete(path)
      else expanded.add(path)
      // The button is replaced by its counterpart, so focus is moved to the new button.
      await nextTick()
      buttons.get(path)?.focus()
    }
    const button = (path: string, label: string, name?: string, open = false): VNode => {
      // Vue calls the ref with null once the button is gone. The path is dropped then, unless a newer button took it.
      let own: HTMLElement | undefined
      return h('button', {
        'type': 'button',
        'class': open ? 'druxt-debug__fold druxt-debug__fold--open' : 'druxt-debug__fold',
        'aria-expanded': String(open),
        'aria-label': name,
        'ref': (element: unknown) => {
          if (element) buttons.set(path, own = element as HTMLElement)
          else if (buttons.get(path) === own) buttons.delete(path)
        },
        'onClick': () => toggle(path),
      }, label)
    }

    const render = (value: unknown, depth: number, path: string): (VNode | string)[] => {
      if (typeof value === 'string') {
        if (value.length <= LONG) return [h('span', { class: 'druxt-debug__string' }, JSON.stringify(value))]
        if (!expanded.has(path)) {
          return [h('span', { class: 'druxt-debug__string' }, `${JSON.stringify(value.slice(0, FOLDED_AT)).slice(0, -1)}…"`), ' ', button(path, `+${value.length - FOLDED_AT} chars`)]
        }
        return [h('span', { class: 'druxt-debug__string' }, JSON.stringify(value)), ' ', button(path, 'fold', `Fold to ${FOLDED_AT} characters`, true)]
      }
      if (value === null || value === undefined) return [h('span', { class: 'druxt-debug__null' }, 'null')]
      if (!isTree(value)) return [h('span', { class: 'druxt-debug__literal' }, JSON.stringify(value))]
      const entries = Object.entries(value)
      const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}']
      if (!entries.length) return [`${open}${close}`]
      const folds = depth >= 2 || (depth === 1 && entries.some(([, child]) => isTree(child)))
      if (folds && !expanded.has(path)) return [button(path, `${open}…${close} ${size(value)}`)]
      const indent = '  '.repeat(depth + 1)
      return [
        folds ? button(path, open!, `Fold ${size(value)}`, true) : open!,
        '\n',
        ...entries.flatMap(([key, child], index) => [
          indent,
          ...(Array.isArray(value) ? [] : [h('span', { class: 'druxt-debug__key' }, JSON.stringify(key)), ': ']),
          // The key is escaped as in a JSON Pointer, so a `/` in a key is not read as a level.
          ...render(child, depth + 1, `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`),
          index < entries.length - 1 ? ',\n' : '\n',
        ]),
        `${'  '.repeat(depth)}${close}`,
      ]
    }
    return () => render(props.value, 0, '')
  },
})
