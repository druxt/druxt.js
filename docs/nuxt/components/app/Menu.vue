<template>
  <ul class="menu">
    <slot name="title" />
    <li v-for="(item, key) of items" :key="key">
      <component :is="item.component" class="rounded-btn" v-bind="item.props">
        <component
          :is="`app-icon-${item.icon}`"
          v-if="item.icon"
          class="inline-block w-5 h-5 mr-2 stroke-current"
        />
        {{ item.text }}
      </component>
      <ul
        v-if="children && item.children"
        v-show="$route.path.startsWith(item.props.to)"
        class="menu"
      >
        <li v-for="(child, childKey) of item.children" :key="childKey">
          <component
            :is="child.component"
            class="rounded-btn"
            v-bind="child.props"
            v-text="child.text"
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    children: {
      type: Boolean,
      default: false,
    },

    home: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    items: ({ $store, home }) => home
      ? $store.state.menu
      : $store.state.menu.filter((o) => o.icon !== 'home')
  }
};
</script>
