<template>
  <div class="px-1 pt-20 overflow-y-auto w-80 bg-base-100">
    <!-- Main menu -->
    <AppMenu class="mb-5">
      <li slot="title" class="menu-title">
        <span>Navigation</span>
      </li>
    </AppMenu>

    <!-- Recent/Pinned documents -->
    <ul v-if="$store.state.recent.length" class="mb-5 menu">
      <li slot="title" class="menu-title">
        <span>Recent documents</span>
      </li>
      <li v-for="(item, key) of $store.state.recent" :key="key">
        <NuxtLink class="rounded-btn" :to="item.to" v-text="item.text" />
      </li>
    </ul>

    <!-- API menu -->
    <ul class="mb-5 menu">
      <li slot="title" class="menu-title">
        <span>API documents</span>
      </li>
      <li>
        <NuxtLink class="rounded-btn" to="/api/packages">Packages</NuxtLink>
        <!-- <ul class="menu">
          <li v-for="item of $store.state.packages" :key="item">
            <NuxtLink class="rounded-btn" :to="`/api/packages/${item}/`" v-text="item" />
          </li>
        </ul> -->
      </li>
    </ul>
  </div>
</template>
