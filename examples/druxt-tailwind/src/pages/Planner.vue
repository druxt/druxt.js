<template>
  <div class="max-w-[1440px] mx-auto">
    <header
      class="border-b border-gray-200 pb-7 mb-8 lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-14 lg:items-end"
    >
      <div>
        <p class="m-0 mb-3 text-[11px] font-semibold tracking-[.16em] uppercase text-accent">
          examples/druxt-tailwind &middot; bespoke modules, no Nuxt
        </p>
        <h1 class="m-0 mb-3 text-4xl lg:text-[44px] leading-[1.05] font-bold tracking-tight">
          Meal Planner
        </h1>
        <p class="m-0 text-[17px] leading-relaxed max-w-[62ch] text-gray-600">
          Drag recipes onto a week and watch the plan take shape. A tool
          built out of content rather than a page that renders it &mdash; and
          the one app in the suite with nothing to server-render, which is
          exactly why it runs without Nuxt.
        </p>
      </div>
      <div class="flex flex-col gap-2 text-xs leading-normal text-gray-500">
        <div class="flex gap-2.5">
          <span class="w-1.5 h-1.5 bg-accent mt-1.5 shrink-0"></span>
          <span>Native HTML5 drag-and-drop, no drag library</span>
        </div>
        <div class="flex gap-2.5">
          <span class="w-1.5 h-1.5 bg-accent mt-1.5 shrink-0"></span>
          <span>Vuex-derived per-day and per-week totals</span>
        </div>
        <div class="flex gap-2.5">
          <span class="w-1.5 h-1.5 bg-accent mt-1.5 shrink-0"></span>
          <span>No SSR by design &mdash; plain Vue 2.7 + Vite + vue-router 3</span>
        </div>
      </div>
    </header>

    <div v-if="$fetchState.pending" class="text-sm text-gray-500 py-24 text-center">
      Loading recipes&hellip;
    </div>
    <div v-else-if="$fetchState.error" class="text-sm text-gray-500 py-24 text-center">
      Couldn't reach the backend.
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
      <section class="border border-gray-200" aria-label="Recipe library">
        <div class="border-b border-gray-200 px-[18px] py-4">
          <h2 class="m-0 mb-1 text-xs font-semibold tracking-[.12em] uppercase">
            Recipe library
          </h2>
          <p class="m-0 text-xs text-gray-500">{{ libraryCountLabel }}</p>
        </div>
        <div class="border-b border-gray-200 px-[18px] py-3 flex flex-wrap gap-1.5">
          <button
            v-for="chip in chips"
            :key="chip"
            data-testid="mp-chip"
            :data-cat="chip"
            type="button"
            class="border px-2.5 py-[5px] text-[11px] font-medium cursor-pointer"
            :class="
              chip === cat
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900'
            "
            @click="cat = chip"
          >
            {{ chip }}
          </button>
        </div>
        <div class="max-h-[640px] overflow-auto">
          <div
            v-for="r in visibleRecipes"
            :key="r.id"
            data-testid="mp-row"
            :data-id="r.id"
            draggable="true"
            class="grid grid-cols-[56px_1fr] gap-3 px-[18px] py-3 border-b border-gray-100 cursor-grab items-center hover:bg-gray-50"
            @dragstart="onRowDragStart(r, $event)"
            @dragend="onDragEnd"
            @click="select(r.id)"
          >
            <img
              :src="r.img"
              :alt="r.title"
              class="w-14 h-14 object-cover block pointer-events-none"
            />
            <div class="flex flex-col gap-[3px]">
              <span class="text-sm font-semibold leading-tight">{{ r.title }}</span>
              <span class="text-[11px] text-gray-500">{{ r.meta }}</span>
              <span
                v-if="isSelected(r.id)"
                data-testid="mp-selected-hint"
                class="text-[11px] font-semibold text-accent"
              >
                Selected &mdash; tap a day to place
              </span>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 px-[18px] py-3.5 text-[11px] leading-relaxed text-gray-500">
          Drag a row onto a day. On touch, tap to select then tap a day &mdash;
          the same store action either way.
        </div>
      </section>

      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 border border-gray-200 divide-x divide-gray-200">
          <div class="px-5 py-4">
            <p class="m-0 mb-1.5 text-[11px] font-semibold tracking-[.12em] uppercase text-gray-500">
              Meals planned
            </p>
            <p data-testid="mp-week-count" class="m-0 text-[28px] font-bold tracking-tight">
              {{ weekCount }}
            </p>
          </div>
          <div class="px-5 py-4">
            <p class="m-0 mb-1.5 text-[11px] font-semibold tracking-[.12em] uppercase text-gray-500">
              Total time
            </p>
            <p data-testid="mp-week-time" class="m-0 text-[28px] font-bold tracking-tight">
              {{ weekTimeLabel }}
            </p>
          </div>
          <div class="px-5 py-4">
            <p class="m-0 mb-1.5 text-[11px] font-semibold tracking-[.12em] uppercase text-gray-500">
              Busiest day
            </p>
            <p data-testid="mp-busiest" class="m-0 text-[28px] font-bold tracking-tight">
              {{ busiestLabel }}
            </p>
          </div>
          <div class="px-5 py-4">
            <p class="m-0 mb-1.5 text-[11px] font-semibold tracking-[.12em] uppercase text-gray-500">
              Category mix
            </p>
            <p data-testid="mp-mix" class="m-0 text-[13px] leading-normal text-gray-600">
              {{ mixLabel }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-7 border border-gray-200">
          <div
            v-for="day in DAYS"
            :key="day"
            data-testid="mp-day"
            :data-day="day"
            class="border-b border-gray-200 lg:border-b-0 lg:border-r lg:last:border-r-0 min-h-24 lg:min-h-[420px] flex flex-col"
            :class="over === day ? 'bg-[#fef2f0]' : 'bg-white'"
            @dragover.prevent
            @dragenter.prevent="setOver(day)"
            @dragleave="clearOver(day)"
            @drop="onDrop(day, $event)"
            @click="onDayClick(day)"
          >
            <div class="px-3 pt-3 pb-2.5 border-b border-gray-200 flex flex-col gap-[3px]">
              <span class="text-xs font-semibold tracking-[.1em] uppercase">{{ day }}</span>
              <span class="text-[11px] text-gray-500">{{ dayTotalsLabel(day) }}</span>
            </div>
            <div class="flex-1 p-2.5 flex flex-col gap-2">
              <div
                v-for="item in dayItems(day)"
                :key="item.id"
                data-testid="mp-item"
                :data-day="day"
                :data-id="item.id"
                draggable="true"
                class="border border-gray-200 border-l-[3px] border-l-accent px-2.5 py-2 flex flex-col gap-[5px] cursor-grab bg-white"
                @dragstart.stop="onItemDragStart(day, item.id, $event)"
                @dragend="onDragEnd"
              >
                <span class="text-xs font-semibold leading-snug">{{ item.title }}</span>
                <span class="text-[10px] text-gray-500">{{ item.meta }}</span>
                <button
                  data-testid="mp-remove"
                  type="button"
                  class="self-start border-0 bg-none p-0 text-[10px] text-gray-500 cursor-pointer underline hover:text-accent-dark"
                  @click.stop="removePlaced(day, item.id)"
                >
                  Remove
                </button>
              </div>
              <div
                v-if="!dayItems(day).length"
                data-testid="mp-day-empty"
                :data-day="day"
                class="flex-1 border border-dashed border-gray-200 flex items-center justify-center text-center px-3 text-[11px] leading-normal text-gray-400"
              >
                {{ selected ? 'Tap to place here' : 'Drop a recipe' }}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section class="border border-gray-200 px-[22px] py-5" aria-label="Shopping list">
            <h3 class="m-0 mb-3 text-xs font-semibold tracking-[.12em] uppercase">
              Shopping list
            </h3>
            <p class="m-0 mb-3.5 text-xs leading-relaxed text-gray-500">
              Derived state, not stored: every field_ingredients line from
              every placed recipe, deduplicated in a Vuex getter.
            </p>
            <p v-if="!shoppingList.length" class="m-0 text-[13px] text-gray-400">
              Place a recipe to build the list.
            </p>
            <div
              v-else
              data-testid="mp-shopping"
              class="columns-2 gap-x-6 text-xs leading-[1.7] text-gray-700"
            >
              <div
                v-for="line in shoppingList"
                :key="line"
                data-testid="mp-shopping-item"
                class="break-inside-avoid"
              >
                {{ line }}
              </div>
            </div>
          </section>

          <section class="border border-gray-200 px-[22px] py-5" aria-label="Why this app has no Nuxt">
            <h3 class="m-0 mb-3 text-xs font-semibold tracking-[.12em] uppercase">
              Why this app has no Nuxt
            </h3>
            <div class="flex flex-col gap-2.5 text-[13px] leading-relaxed text-gray-600">
              <p class="m-0">
                A planner has no SEO surface and no shareable content URLs:
                nothing here benefits from being rendered on a server. The
                plan itself never round-trips to Drupal &mdash; it is Vuex
                state assembled from server content, so the app can be a
                static bundle that talks to JSON:API and nothing else.
              </p>
              <p class="m-0">
                Everything Nuxt would wire automatically is done by hand in
                <code class="font-mono text-xs">src/main.js</code>: client
                injection, the Druxt store modules, the fetch mixin, and
                component registration.
              </p>
              <p class="m-0">
                <strong class="text-gray-900">Mobile.</strong> Below
                <code class="font-mono text-xs">lg</code> the two panes
                stack: library first, day columns become a vertical list of
                day sections. Drag is replaced by select-then-tap (visible
                on desktop too, as the keyboard/assistive path) &mdash; both
                call the same <code class="font-mono text-xs">plan/place</code>
                action.
              </p>
              <p class="m-0">
                <strong class="text-gray-900">Scope note.</strong> Per-day
                lists rather than breakfast/lunch/dinner slots. Slots are a
                one-line change to the store shape if wanted, but the
                simpler model keeps the drag target big.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// drupal-jsonapi-params is Babel-compiled ESM with no default export -
// Nuxt's webpack interop hides this, Vite does not.
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DAYS } from '../store/plan'

export default {
  data: () => ({
    DAYS,
    recipes: [],
    cat: 'All',
    // The in-flight drag - kept here (not in the store) because it is
    // purely pointer state: which recipe a drop should place, and which
    // day (if any) it is being moved *from*. Drop handlers prefer
    // dataTransfer data and fall back to this, so synthetic drag events
    // without a real DataTransfer (tests) still place correctly.
    dragging: null,
  }),

  computed: {
    categories() {
      const seen = []
      this.recipes.forEach((r) => {
        if (r.category && !seen.includes(r.category)) seen.push(r.category)
      })
      return seen
    },

    chips() {
      return ['All', ...this.categories]
    },

    visibleRecipes() {
      return this.cat === 'All'
        ? this.recipes
        : this.recipes.filter((r) => r.category === this.cat)
    },

    byId() {
      return this.recipes.reduce((map, r) => ({ ...map, [r.id]: r }), {})
    },

    libraryCountLabel() {
      return `${this.visibleRecipes.length} of ${this.recipes.length} recipes · source: node--recipe collection`
    },

    selected() {
      return this.$store.state.plan.selected
    },

    over() {
      return this.$store.state.plan.over
    },

    weekCount() {
      return this.$store.getters['plan/weekCount']
    },

    weekTimeLabel() {
      const minutes = this.$store.getters['plan/weekMinutes']
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    },

    busiestLabel() {
      return this.weekCount ? this.$store.getters['plan/busiestDay'] : '—'
    },

    mixLabel() {
      return this.$store.getters['plan/mixLabel']
    },

    shoppingList() {
      return this.$store.getters['plan/shoppingList']
    },
  },

  async fetch() {
    const type = 'node--recipe'
    const resources = await this.$store.dispatch('druxt/getCollection', {
      type,
      query: new DrupalJsonApiParams()
        .addFilter('status', '1')
        .addSort('created', 'DESC')
        .addFields(type, [
          'title',
          'field_difficulty',
          'field_preparation_time',
          'field_cooking_time',
          'field_ingredients',
          'field_recipe_category',
          'field_media_image',
        ])
        .addInclude([
          'field_media_image',
          'field_media_image.field_media_image',
          'field_recipe_category',
        ])
        .addFields('media--image', ['field_media_image'])
        .addFields('file--file', ['uri'])
        .addFields('taxonomy_term--recipe_category', ['name'])
        .addPageLimit(50),
    })

    const included = Object.fromEntries(
      (resources.included || []).map((resource) => [resource.id, resource])
    )
    // Relationship data is an array for multi-value fields (category) and
    // a plain object for single-value fields (image refs) - normalize to
    // the first reference either way.
    const first = (relationship) => {
      const data = (relationship || {}).data
      return Array.isArray(data) ? data[0] : data
    }

    this.recipes = (resources.data || []).map((resource) => {
      const attributes = resource.attributes
      const mediaRef = first(resource.relationships.field_media_image)
      const media = mediaRef && included[mediaRef.id]
      const fileRef = media && first(media.relationships.field_media_image)
      const file = fileRef && included[fileRef.id]
      const uri = file && file.attributes.uri.value
      const relative = uri && uri.replace(/^public:\/\//, '')
      const categoryRef = first(resource.relationships.field_recipe_category)
      const term = categoryRef && included[categoryRef.id]
      const prep = attributes.field_preparation_time || 0
      const cook = attributes.field_cooking_time || 0
      const category = term && term.attributes.name
      const difficulty = attributes.field_difficulty
      return {
        id: resource.id,
        title: attributes.title,
        category,
        minutes: prep + cook,
        // Pre-generated backend derivative (druxt_thumb_4_3, 240x180)
        // for the 56px library thumbnail.
        img:
          relative &&
          `/sites/default/files/styles/druxt_thumb_4_3/public/${relative}`,
        meta: `${(category || '').toLowerCase()} · ${prep + cook} min · ${(difficulty || '').toLowerCase()}`,
      }
    })
  },

  methods: {
    isSelected(id) {
      return this.selected && this.selected.id === id && !this.selected.fromDay
    },

    dayItems(day) {
      return this.$store.state.plan.plan[day]
        .map((id) => this.byId[id])
        .filter(Boolean)
        .map((r) => ({
          ...r,
          meta: `${r.minutes} min · ${(r.category || '').toLowerCase()}`,
        }))
    },

    dayTotalsLabel(day) {
      const count = this.$store.state.plan.plan[day].length
      return count
        ? `${count} · ${this.$store.getters['plan/dayMinutes'](day)} min`
        : '—'
    },

    select(id) {
      this.$store.dispatch('plan/select', id)
    },

    setOver(day) {
      this.$store.dispatch('plan/setOver', day)
    },

    clearOver(day) {
      if (this.over === day) this.$store.dispatch('plan/setOver', null)
    },

    removePlaced(day, id) {
      this.$store.dispatch('plan/remove', { day, id })
    },

    // Both placement paths dispatch the same 'plan/place' action - the
    // whole point of the click-to-place path being in the store too.
    onDayClick(day) {
      if (this.selected) {
        this.$store.dispatch('plan/place', {
          day,
          id: this.selected.id,
          fromDay: this.selected.fromDay,
        })
      }
    },

    onRowDragStart(recipe, event) {
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData('text/plain', recipe.id)
      }
      this.dragging = { id: recipe.id, fromDay: null }
    },

    onItemDragStart(day, id, event) {
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', id)
      }
      this.dragging = { id, fromDay: day }
    },

    onDragEnd() {
      this.dragging = null
      this.$store.dispatch('plan/setOver', null)
    },

    onDrop(day, event) {
      event.preventDefault()
      const raw = event.dataTransfer ? event.dataTransfer.getData('text/plain') : ''
      const id = raw || (this.dragging || {}).id
      if (id) {
        this.$store.dispatch('plan/place', {
          day,
          id,
          fromDay: (this.dragging || {}).fromDay,
        })
      }
      this.dragging = null
    },
  },
}
</script>
