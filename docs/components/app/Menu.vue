<template>
  <ul class="menu">
    <slot name="title" />
    <li v-for="(item, key) of $store.state.menu" :key="key">
      <component
        :is="item.component"
        class="rounded-btn"
        v-bind="item.props"
        v-text="item.text"
      />
      <ul v-if="children && item.children" class="menu">
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
  },
};
</script>
