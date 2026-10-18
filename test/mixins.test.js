import DruxtBlock from '../packages/blocks/src/components/DruxtBlock.vue'
import DruxtBlockRegion from '../packages/blocks/src/components/DruxtBlockRegion.vue'
import { DruxtBlocksBlockMixin, DruxtBlocksRegionMixin } from '../packages/blocks/src/mixins'
import DruxtBreadcrumb from '../packages/breadcrumb/src/components/DruxtBreadcrumb.vue'
import { DruxtBreadcrumbMixin } from '../packages/breadcrumb/src/mixins/breadcrumb'
import DruxtEntity from '../packages/entity/src/components/DruxtEntity.vue'
import DruxtField from '../packages/entity/src/components/DruxtField.vue'
import { DruxtEntityMixin, DruxtFieldMixin } from '../packages/entity/src/mixins'
import DruxtMenu from '../packages/menu/src/components/DruxtMenu.vue'
import { DruxtMenuMixin } from '../packages/menu/src/mixins'
import DruxtRouter from '../packages/router/src/components/DruxtRouter.vue'
import { DruxtRouterMixin } from '../packages/router/src/mixins'
import DruxtSite from '../packages/site/src/components/DruxtSite.vue'
import { DruxtSiteMixin } from '../packages/site/src/mixins/site'
import DruxtView from '../packages/views/src/components/DruxtView.vue'
import DruxtViewsFilter from '../packages/views/src/components/DruxtViewsFilter.vue'
import DruxtViewsFilters from '../packages/views/src/components/DruxtViewsFilters.vue'
import DruxtViewsPager from '../packages/views/src/components/DruxtViewsPager.vue'
import DruxtViewsSorts from '../packages/views/src/components/DruxtViewsSorts.vue'
import {
  DruxtViewsFilterMixin,
  DruxtViewsFiltersMixin,
  DruxtViewsPagerMixin,
  DruxtViewsSortsMixin,
  DruxtViewsViewMixin,
} from '../packages/views/src/mixins'

// A module hands its theme component every propsData key, plus the langcode
// DruxtModule adds. A key the theme does not declare is an attribute, and Vue
// renders it on the theme's root element, so an object reads [object Object]
// in the markup. A theme built on the module's mixin must declare them all.
const modules = [
  ['DruxtBlock', DruxtBlock, DruxtBlocksBlockMixin, { block: {} }],
  ['DruxtBlockRegion', DruxtBlockRegion, DruxtBlocksRegionMixin, { blocks: [], name: 'content', theme: 'olivero' }],
  ['DruxtBreadcrumb', DruxtBreadcrumb, DruxtBreadcrumbMixin, { model: [] }],
  ['DruxtEntity', DruxtEntity, DruxtEntityMixin, { fields: {}, model: {}, schema: {} }],
  ['DruxtField', DruxtField, DruxtFieldMixin, { errors: [], model: {}, relationship: false, schema: {} }],
  ['DruxtMenu', DruxtMenu, DruxtMenuMixin, { model: [], parentId: null }],
  ['DruxtRouter', DruxtRouter, DruxtRouterMixin, { $route: { fullPath: '/' }, path: '/', model: {} }],
  ['DruxtSite', DruxtSite, DruxtSiteMixin, { defaultTheme: 'olivero', props: {}, regions: [], theme: undefined }],
  ['DruxtView', DruxtView, DruxtViewsViewMixin, {}],
  ['DruxtViewsFilter', DruxtViewsFilter, DruxtViewsFilterMixin, { filter: {}, model: {} }],
  ['DruxtViewsFilters', DruxtViewsFilters, DruxtViewsFiltersMixin, { filters: [], model: {}, options: {}, type: 'exposed' }],
  ['DruxtViewsPager', DruxtViewsPager, DruxtViewsPagerMixin, { count: 0, model: 1, options: {}, resource: {}, type: 'mini' }],
  ['DruxtViewsSorts', DruxtViewsSorts, DruxtViewsSortsMixin, { model: '', options: {}, sorts: [], type: 'exposed' }],
]

describe('theme mixins', () => {
  test.each(modules)('the %s mixin declares everything its module hands a theme', (name, module, mixin, context) => {
    const sent = ['langcode', ...Object.keys(module.druxt.propsData(context))]
    const declared = Object.keys(mixin.props)
    expect(sent.filter((key) => !declared.includes(key))).toEqual([])
  })
})
