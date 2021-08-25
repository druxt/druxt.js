<template>
  <ul class="menu">
    <slot name="title" />
    <li v-for="(item, key) of $store.state.menu" :key="key">
      <component :is="item.component" class="rounded-btn" v-bind="item.props" v-text="item.text" />
    </li>
  </ul>
</template>
