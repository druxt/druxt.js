import Vue from 'vue'
import { setupDevtoolsPlugin } from '@vue/devtools-api'

Vue.mixin({
  beforeCreate() {
    if (process.env.NODE_ENV === 'development') {
      const createAction = (component, payload) => ({
        icon: 'save',
        tooltip: `Create ${component} and open in editor`,
        action: () => payload.app.$axios({
          url: '/_druxt/template/add',
          baseURL: '/',
          method: 'post',
          data: {
            path: component,
            settings: {
              component: payload.componentInstance.$options._componentTag,
              props: Object.entries(payload.componentInstance.component.propsData || {}).map(([key, value]) => ({ key, type: typeof value })),
              slots: payload.componentInstance.component.slots,
              ...((payload.componentInstance.$options.druxt || {}).template || {}),
            }
          }
        })
      })
      const inspectorId = 'druxt'
      const stateType = 'druxt'

      setupDevtoolsPlugin({
        id: 'druxt',
        label: 'DruxtJS',
        packageName: 'druxt',
        homepage: 'https://druxtjs.org',
        componentStateTypes: [stateType],
        app: this
      }, api => {
        api.addInspector({
          id: inspectorId,
          label: 'DruxtJS',
          icon: 'opacity',
        })

        api.on.inspectComponent((payload) => {
          if (payload.instanceData.state && payload.componentInstance.component) {
            payload.instanceData.state.push({
              type: stateType,
              key: '$theme',
              value: {
                _custom: {
                  type: null,
                  readOnly: true,
                  display: payload.componentInstance.component.is,
                  value: payload.componentInstance.component.options.map((option) => ({
                    _custom: {
                      type: null,
                      display: option,
                      actions: !payload.componentInstance.$nuxt.$options.components[option]
                        ? [createAction(option, payload)]
                        : [],
                    }
                  })),
                },
              },
            })
          }
        })

        api.on.getInspectorTree((payload) => {
          if (payload.inspectorId === inspectorId) {
            payload.rootNodes = [
              {
                id: 'connect',
                label: 'Connection details',
              }
            ]
          }
        })

        api.on.getInspectorState((payload) => {
          if (payload.inspectorId === inspectorId) {
            if (payload.nodeId === 'connect') {
              const { baseUrl, endpoint } = payload.app.$druxt.settings
              payload.state = {
                settings: [
                  {
                    key: 'baseUrl',
                    value: baseUrl,
                  },
                  {
                    key: 'endpoint',
                    value: endpoint,
                  },
                ],
                computed: [
                  {
                    key: 'jsonApi',
                    value: baseUrl + endpoint
                  }
                ]
              }
            }
          }
        })

        api.on.visitComponentTree((payload) => {
          const node = payload.treeNode
          if (payload.componentInstance.$options.druxt) {
            node.tags.push({
              label: 'druxt',
              textColor: 0xffffff,
              backgroundColor: 0x3498dB
            })
          }
        })
      })
    }
  }
})
