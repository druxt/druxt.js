import Vue from 'vue'

import DruxtEntityTaxonomyTermDefault from '~/components/druxt/entity/taxonomy_term/Default.vue'
import DruxtSiteUmami from '~/components/druxt/site/Umami.vue'

// DruxtModule's wrapper resolution (packages/druxt/src/components/DruxtModule.vue)
// only picks a candidate name Vue considers globally registered - Nuxt's
// directory-based auto-import didn't pick these two up (new leaf
// directories, unlike the pre-existing components/druxt/entity/node/ etc.
// that resolve fine), so register them directly.
Vue.component('DruxtEntityTaxonomyTermDefault', DruxtEntityTaxonomyTermDefault)
Vue.component('DruxtSiteUmami', DruxtSiteUmami)
