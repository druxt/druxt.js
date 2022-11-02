<template>
  <div>
    <select v-model="option">
      <option
        v-for="(label, key) of options"
        :key="key"
        v-text="label"
      />
    </select>
    <button @click="onClick">
      Create
    </button>
  </div>
</template>

<script>
export default {
  data: () => ({
    option: undefined,
  }),

  computed: {
    module: ({ $parent }) => ($parent.component || {}).options
      ? $parent
      : ($parent.$parent || {}).$parent || {},
    options: ({ module }) => (module.component || {}).options || []
  },

  created() {
    this.option = this.options[0]
  },

  methods: {
    onClick() {
      this.$axios({
        url: '/_druxt/template/add',
        baseURL: '/',
        method: 'post',
        data: {
          path: this.option,
          settings: {
            component: this.module.$options._componentTag,
            props: Object.entries(this.module.component.propsData || {}).map(([key, value]) => ({ key, type: typeof value })),
            slots: this.module.component.slots,
            ...((this.module.$options.druxt || {}).template || {}),
          }
        }
      })
    }
  }
}
</script>
