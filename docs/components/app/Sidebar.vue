<template>
  <div class="px-1 pt-20 overflow-y-auto w-80 bg-base-100">
    <!-- Search -->
    <AppSearch class="mb-5" />

    <!-- Recent documents -->
    <ul v-if="$store.state.recent.length" class="mb-5 menu">
      <li slot="title" class="menu-title">
        <span>Recent documents</span>
      </li>
      <li v-for="(item, key) of $store.state.recent" :key="key">
        <NuxtLink class="rounded-btn" :to="item.to">
          <component
            :is="`app-icon-${item.to.slice(1).split('/')[0]}`"
            class="inline-block w-5 h-5 mr-2 stroke-current text-gray-400"
          />
          {{ item.text }}
        </NuxtLink>
      </li>
    </ul>

    <!-- Main menu -->
    <AppMenu class="mb-5" :children="true">
      <li slot="title" class="menu-title">
        <span>Navigation</span>
      </li>
    </AppMenu>
  </div>
</template>
