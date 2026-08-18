<template>
  <div class="max-w-[560px] mx-auto">
    <div class="flex items-center justify-between py-2 md:py-5">
      <h1 class="font-heading text-2xl font-bold">Recipe Box</h1>
      <button
        v-if="view === 'deck'"
        type="button"
        data-testid="rb-view-box"
        class="btn btn-sm rounded-full bg-base-200 hover:bg-base-300 border-0 font-semibold gap-2"
        @click="view = 'box'"
      >
        Box
        <span class="bg-primary text-primary-content rounded-full min-w-[22px] px-1.5 text-center text-xs font-semibold">{{ ready ? count : 0 }}</span>
      </button>
      <button
        v-else
        type="button"
        data-testid="rb-view-deck"
        class="btn btn-sm rounded-full bg-base-200 hover:bg-base-300 border-0 font-semibold"
        @click="view = 'deck'"
      >
        Back to the deck
      </button>
    </div>

    <template v-if="view === 'deck'">
      <div v-if="!$fetchState.pending" class="flex gap-2 overflow-x-auto pb-3">
        <button
          v-for="label of chipLabels"
          :key="label"
          type="button"
          class="flex-none rounded-full px-3.5 py-2 text-[13px] font-semibold cursor-pointer transition-colors"
          :class="cat === label
            ? 'bg-primary text-primary-content'
            : 'border border-base-300 bg-base-100 text-base-content/70 hover:border-primary hover:text-primary'"
          @click="pick(label)"
          v-text="label"
        />
      </div>

      <div class="relative h-[46dvh] max-h-[560px] md:h-[560px] my-2 overflow-hidden">
        <transition name="rb-card" mode="out-in">
          <div
            v-if="card"
            :key="card.id"
            data-testid="rb-card"
            class="absolute inset-0 bg-base-100 rounded-3xl overflow-hidden flex flex-col touch-none cursor-grab active:cursor-grabbing select-none"
            :style="cardStyle"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
          >
            <img :src="card.img" :alt="card.title" class="w-full flex-none aspect-[4/3] object-cover pointer-events-none" />
            <div class="flex-1 min-h-0 p-5 flex flex-col gap-2.5">
              <span v-if="card.category" class="self-start badge bg-accent text-accent-content border-0 font-semibold">{{ card.category }}</span>
              <h2 class="m-0 font-heading text-[28px] leading-[1.1] font-semibold">{{ card.title }}</h2>
              <p class="m-0 text-sm leading-relaxed text-base-content/70 flex-1 min-h-0 overflow-hidden line-clamp-3">{{ summaryText }}</p>
              <div class="flex gap-2 flex-wrap flex-none">
                <span v-if="card.difficulty" class="badge bg-secondary text-secondary-content border-0 font-semibold capitalize">{{ card.difficulty }}</span>
                <span v-if="card.prep" class="badge badge-outline">Prep {{ card.prep }} min</span>
                <span v-if="card.cook" class="badge badge-outline">Cook {{ card.cook }} min</span>
              </div>
            </div>

            <span v-if="dx > 60" class="absolute top-6 left-6 border-[3px] border-secondary text-secondary bg-base-100/90 rounded-xl px-3.5 py-1.5 text-lg font-bold -rotate-[8deg]">SAVE</span>
            <span v-if="dx < -60" class="absolute top-6 right-6 border-[3px] border-[#b3300f] text-[#b3300f] bg-base-100/90 rounded-xl px-3.5 py-1.5 text-lg font-bold rotate-[8deg]">SKIP</span>
          </div>
        </transition>

        <div
          v-if="!$fetchState.pending && !card"
          class="absolute inset-0 border-2 border-dashed border-base-300 rounded-3xl flex flex-col items-center justify-center gap-4 text-center p-8"
        >
          <h2 class="m-0 font-heading text-[26px] font-semibold">That's the whole deck</h2>
          <p class="m-0 text-sm leading-relaxed text-base-content/70 max-w-[28ch]">{{ emptyLine }}</p>
          <button type="button" class="btn btn-primary font-semibold" @click="reset">Start over</button>
        </div>

        <transition name="rb-toast">
          <span v-if="toast" data-testid="rb-toast" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-content rounded-full px-4 py-2 text-sm font-semibold shadow-lg">Saved to your box</span>
        </transition>
      </div>

      <div v-if="card" class="flex gap-3">
        <button type="button" data-testid="rb-skip" class="btn flex-1 btn-outline border-base-300 bg-base-100 text-base-content/70 hover:border-[#b3300f] hover:bg-base-100 hover:text-[#b3300f] font-semibold" @click="commit(-1)">Skip</button>
        <button type="button" data-testid="rb-open" class="btn btn-outline border-base-300 bg-base-100 text-base-content/70 hover:border-primary hover:bg-base-100 hover:text-primary font-semibold" @click="openDetail">Open</button>
        <button type="button" data-testid="rb-save" class="btn flex-1 btn-primary border-0 font-semibold" @click="commit(1)">Save</button>
      </div>

      <p class="m-0 pt-2 pb-2 md:pt-4 md:pb-6 text-xs leading-relaxed text-base-content/50 text-center">{{ hintLine }}</p>
    </template>

    <template v-else>
      <div class="py-4 min-h-[420px]">
        <div
          v-if="!count"
          class="border-2 border-dashed border-base-300 rounded-3xl p-10 text-center flex flex-col gap-3 items-center"
        >
          <h2 class="m-0 font-heading text-2xl font-semibold">Nothing saved yet</h2>
          <p class="m-0 text-sm leading-relaxed text-base-content/70 max-w-[26ch]">Swipe right on a recipe and it lands here. Your box stays on this device.</p>
          <button type="button" class="btn btn-primary border-0 font-semibold" @click="view = 'deck'">Back to the deck</button>
        </div>

        <transition-group v-else name="rb-pop" tag="div" class="grid grid-cols-2 gap-3.5">
          <div
            v-for="recipe of savedRecipes"
            :key="recipe.id"
            data-testid="rb-tile"
            class="bg-base-200 rounded-2xl overflow-hidden relative"
          >
            <button type="button" class="block w-full text-left" @click="detailId = recipe.id">
              <img :src="recipe.thumb" :alt="recipe.title" class="w-full h-[104px] object-cover" />
              <div class="p-2.5 pb-3.5 flex flex-col gap-1.5">
                <h2 class="m-0 font-heading text-base leading-tight font-semibold">{{ recipe.title }}</h2>
                <span class="text-xs text-base-content/50">{{ meta(recipe) }}</span>
              </div>
            </button>
            <button
              type="button"
              title="Remove"
              :aria-label="`Remove ${recipe.title} from your box`"
              class="absolute top-2 right-2 border-0 bg-base-100/90 text-[#b3300f] rounded-full w-7 h-7 text-base leading-none cursor-pointer hover:bg-base-100"
              @click="remove(recipe.id)"
            >
              &times;
            </button>
          </div>
        </transition-group>
      </div>

      <div class="flex items-center gap-2.5 py-4 border-t border-base-300">
        <span class="w-2 h-2 rounded-full bg-secondary flex-none" />
        <p class="m-0 text-xs leading-relaxed text-base-content/50">Saved on this device. No account, no server &mdash; Vuex state written to localStorage, restored on load.</p>
      </div>
    </template>

    <RecipeDetailPanel :id="detailId" @close="detailId = null" />
  </div>
</template>

<script>
import { fetchCategories, fetchRecipes } from '~/assets/js/recipes'

const COMMIT_THRESHOLD = 90
const EXIT_DISTANCE = 460
const EXIT_MS = 220

export default {
  data: () => ({
    view: 'deck',
    recipes: [],
    categories: [],
    cat: 'All',
    index: 0,
    dx: 0,
    dragging: false,
    leaving: false,
    toast: false,
    ready: false,
    startX: 0,
    timer: undefined,
    toastTimer: undefined,
    detailId: null,
  }),

  async fetch() {
    const [recipes, categories] = await Promise.all([
      fetchRecipes(this.$store),
      fetchCategories(this.$store),
    ])
    this.recipes = recipes
    this.categories = categories
  },

  computed: {
    count() {
      return this.$store.getters['recipeBox/count']
    },

    chipLabels: ({ categories }) => ['All'].concat(categories),

    deck: ({ recipes, cat }) =>
      cat === 'All' ? recipes : recipes.filter((r) => r.category === cat),

    card: ({ deck, index }) => deck[index],

    cardStyle: ({ dx, dragging }) => ({
      transform: `translateX(${dx}px) rotate(${Math.round((dx / 18) * 10) / 10}deg)`,
      transition: dragging ? 'none' : `transform ${EXIT_MS}ms ease-out`,
    }),

    // Strips markup for the card's plain-text summary. Loops until the text stops changing,
    // so nested tags can't reform after one pass, and `>?` drops an
    // unterminated trailing tag - single-pass regex stripping leaves both
    // behind (CodeQL js/incomplete-multi-character-sanitization).
    summaryText: ({ card }) => {
      let text = card.summary
      let previous
      do {
        previous = text
        text = text.replace(/<[^>]*>?/g, '')
      } while (text !== previous)
      return text
    },

    emptyLine() {
      return this.count
        ? `${this.count} recipe${this.count === 1 ? '' : 's'} in your box. Change category, or start the deck again.`
        : 'Nothing saved this round. Change category, or start the deck again.'
    },

    hintLine: ({ card }) =>
      card ? 'Drag the card, use the buttons, or press ← / →.' : 'Deck finished.',

    savedIds() {
      return this.$store.state.recipeBox.ids
    },

    savedRecipes: ({ recipes, savedIds }) =>
      savedIds
        .map((id) => recipes.find((recipe) => recipe.id === id))
        .filter(Boolean),
  },

  mounted() {
    this.ready = true
    window.addEventListener('keydown', this.onKey)
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey)
    clearTimeout(this.timer)
    clearTimeout(this.toastTimer)
  },

  methods: {
    pick(label) {
      clearTimeout(this.timer)
      this.cat = label
      this.index = 0
      this.dx = 0
      this.dragging = false
      this.leaving = false
    },

    reset() {
      this.index = 0
      this.dx = 0
      this.leaving = false
    },

    commit(dir) {
      if (this.leaving || !this.card) return
      const card = this.card
      if (dir > 0) {
        this.$store.commit('recipeBox/ADD', card.id)
        this.toast = true
        clearTimeout(this.toastTimer)
        this.toastTimer = setTimeout(() => (this.toast = false), 1200)
      }
      this.dragging = false
      this.leaving = true
      this.dx = dir * EXIT_DISTANCE
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.index += 1
        this.dx = 0
        this.leaving = false
      }, EXIT_MS)
    },

    onDown(e) {
      if (this.leaving) return
      this.startX = e.clientX
      this.dragging = true
      if (e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch (err) {
          // Synthetic pointer events (tests) have no active pointer to
          // capture - dragging still works via move/up on the element.
        }
      }
    },

    onMove(e) {
      if (!this.dragging) return
      this.dx = e.clientX - this.startX
    },

    onUp() {
      if (!this.dragging) return
      if (this.dx > COMMIT_THRESHOLD) return this.commit(1)
      if (this.dx < -COMMIT_THRESHOLD) return this.commit(-1)
      this.dragging = false
      this.dx = 0
    },

    onKey(e) {
      if (this.view !== 'deck') return
      if (e.key === 'ArrowRight') this.commit(1)
      if (e.key === 'ArrowLeft') this.commit(-1)
      if (e.key === 'Enter' && this.card) this.openDetail()
    },

    openDetail() {
      if (this.card) {
        this.detailId = this.card.id
      }
    },

    meta: (recipe) =>
      [recipe.difficulty, recipe.prep + recipe.cook ? `${recipe.prep + recipe.cook} min` : '']
        .filter(Boolean)
        .join(' · '),

    remove(id) {
      this.$store.commit('recipeBox/REMOVE', id)
    },
  },
}
</script>

<style scoped>
.rb-card-leave-active {
  transition: none !important;
}

.rb-card-enter-active {
  transition: transform 0.22s ease-out, opacity 0.22s ease-out;
}

.rb-card-enter {
  transform: translateY(8px) scale(0.96);
  opacity: 0;
}

.rb-toast-enter-active,
.rb-toast-leave-active {
  transition: transform 0.22s ease-out, opacity 0.22s ease-out;
}

.rb-toast-enter,
.rb-toast-leave-to {
  transform: translate(-50%, 8px);
  opacity: 0;
}

.rb-pop-enter-active {
  transition: transform 0.22s ease-out, opacity 0.22s ease-out;
}

.rb-pop-enter {
  transform: translateY(8px) scale(0.96);
  opacity: 0;
}

.rb-pop-leave-active {
  transition: transform 0.22s ease-out, opacity 0.22s ease-out;
  position: absolute;
}

.rb-pop-leave-to {
  transform: translateY(8px) scale(0.96);
  opacity: 0;
}

.rb-pop-move {
  transition: transform 0.22s ease-out;
}
</style>
