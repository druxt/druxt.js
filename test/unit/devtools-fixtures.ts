import type { DruxtDevtoolsModule, DruxtDevtoolsTemplate } from '../../packages/devtools/src'

/** A module as a host reports it: a DruxtEntity rendering Druxt's default, unless overridden. */
export const module = (id: string, overrides: Partial<DruxtDevtoolsModule> = {}): DruxtDevtoolsModule => ({
  id,
  component: 'DruxtEntity',
  candidates: ['DruxtEntityNodeArticleFull', 'DruxtEntityNodeArticle', 'DruxtEntityDefault'],
  wrapper: null,
  status: 'default',
  props: {},
  state: {},
  settings: {},
  notes: [],
  ...overrides,
})

/** A file the create action can write. */
export const template = (name: string): DruxtDevtoolsTemplate => ({
  name,
  path: `components/druxt/entity/${name.replace('DruxtEntity', '')}.vue`,
  starter: '<template>\n  <article><slot /></article>\n</template>\n',
  request: { component: 'DruxtEntity', name },
})
