/**
 * The Meal Planner's own Vuex module - the plan itself is pure client
 * state (it never round-trips to Drupal), while every number shown next
 * to it (per-day/per-week totals, busiest day, category mix, shopping
 * list) is derived here in getters from the recipes the `druxt` store
 * already holds, so the two can never drift apart.
 *
 * Scope: per-day flat lists, not breakfast/lunch/dinner slots - the
 * simpler model keeps the drop target large. Slots would be a shape
 * change here (`plan[day][slot]` instead of `plan[day]`), not a rewrite:
 * PLACE/REMOVE would take a slot argument and the getters would iterate
 * one level deeper.
 */

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// The druxt store indexes resources as resources[type][id][prefix] where
// prefix is the langcode the fetch used - resources fetched without one
// (this app's own collection query) land under the key "undefined", while
// DruxtEntity-fetched ones land under 'en'. Resolve whichever is present.
const storedResource = (rootState, type, id) => {
  const byId = (((rootState.druxt || {}).resources || {})[type] || {})[id]
  const entry = Object.values(byId || {})[0]
  return (entry || {}).data
}

const emptyPlan = () => DAYS.reduce((plan, day) => ({ ...plan, [day]: [] }), {})

export default {
  namespaced: true,

  state: () => ({
    // Currently selected library recipe awaiting a day tap - the
    // touch/assistive counterpart to dragging. Lives here (not in the
    // component) so both input paths run through the same store.
    selected: null,
    // Day column currently under a drag, for the drop-target highlight.
    over: null,
    plan: emptyPlan(),
  }),

  getters: {
    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     * @param {object} rootState - The store root state.
     *
     * @returns {Function} id -> the placed recipe's JSON:API resource.
     */
    recipe: (state, getters, rootState) => (id) =>
      storedResource(rootState, 'node--recipe', id),

    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     * @param {object} rootState - The store root state.
     *
     * @returns {Function} id -> a recipe category term resource.
     */
    term: (state, getters, rootState) => (id) =>
      storedResource(rootState, 'taxonomy_term--recipe_category', id),

    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     *
     * @returns {Function} day -> placed minutes (prep + cook, summed).
     */
    dayMinutes: (state, getters) => (day) =>
      state.plan[day].reduce((sum, id) => {
        const attributes = ((getters.recipe(id) || {}).attributes) || {}
        return sum + (attributes.field_preparation_time || 0) + (attributes.field_cooking_time || 0)
      }, 0),

    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     *
     * @returns {Function} day -> first category name of a placed recipe.
     */
    dayCategory: (state, getters) => (id) => {
      const relationships = (getters.recipe(id) || {}).relationships || {}
      const data = (relationships.field_recipe_category || {}).data
      const first = Array.isArray(data) ? data[0] : data
      const term = first && getters.term(first.id)
      return ((term || {}).attributes || {}).name
    },

    /**
     * @param {object} state - The module state.
     *
     * @returns {number} Total meals placed this week.
     */
    weekCount: (state) =>
      DAYS.reduce((count, day) => count + state.plan[day].length, 0),

    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     *
     * @returns {number} Total minutes across the whole week.
     */
    weekMinutes: (state, getters) =>
      DAYS.reduce((sum, day) => sum + getters.dayMinutes(day), 0),

    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     *
     * @returns {string} Day label with the most minutes ('-' when empty).
     */
    busiestDay: (state, getters) =>
      DAYS.slice().sort((a, b) => getters.dayMinutes(b) - getters.dayMinutes(a))[0],

    /**
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     *
     * @returns {string} 'Main courses 2 . Desserts 1' style mix label.
     */
    mixLabel: (state, getters) => {
      const counts = {}
      DAYS.forEach((day) =>
        state.plan[day].forEach((id) => {
          const category = getters.dayCategory(id)
          if (category) counts[category] = (counts[category] || 0) + 1
        })
      )
      const entries = Object.keys(counts).map((k) => `${k} ${counts[k]}`)
      return entries.join(' · ') || 'nothing planned yet'
    },

    /**
     * Deduplicated shopping list - every field_ingredients line from
     * every placed recipe, first occurrence wins, stable order (week
     * order, then placement order within a day). Derived, never stored.
     *
     * @param {object} state - The module state.
     * @param {object} getters - The module getters.
     *
     * @returns {string[]} Unique ingredient lines across the plan.
     */
    shoppingList: (state, getters) => {
      const list = []
      DAYS.forEach((day) =>
        state.plan[day].forEach((id) => {
          const ingredients = ((getters.recipe(id) || {}).attributes || {})
            .field_ingredients
          ;(ingredients || []).forEach((line) => {
            if (!list.includes(line)) list.push(line)
          })
        })
      )
      return list
    },
  },

  mutations: {
    PLACE(state, { day, id, fromDay }) {
      const plan = {}
      DAYS.forEach((d) => {
        plan[d] = state.plan[d].slice()
      })
      // Moving a placed item to another day removes it from its origin
      // first; dropping from the library copies.
      if (fromDay) plan[fromDay] = plan[fromDay].filter((x) => x !== id)
      if (!plan[day].includes(id)) plan[day] = plan[day].concat(id)
      state.plan = plan
    },

    REMOVE(state, { day, id }) {
      const plan = {}
      DAYS.forEach((d) => {
        plan[d] = d === day ? state.plan[d].filter((x) => x !== id) : state.plan[d].slice()
      })
      state.plan = plan
    },

    SET_SELECTED(state, selected) {
      state.selected = selected
    },

    SET_OVER(state, over) {
      state.over = over
    },
  },

  actions: {
    /**
     * The one placement path both input methods call: HTML5 drop and
     * select-then-tap dispatch the same action, so they cannot drift.
     *
     * @param {object} context - The Vuex action context.
     * @param {object} payload - Day, recipe id, and origin day if moving.
     */
    place({ commit }, { day, id, fromDay = null }) {
      commit('PLACE', { day, id, fromDay })
      commit('SET_SELECTED', null)
      commit('SET_OVER', null)
    },

    /**
     * @param {object} context - The Vuex action context.
     * @param {object} payload - Day and recipe id to remove.
     */
    remove({ commit }, payload) {
      commit('REMOVE', payload)
    },

    /**
     * Toggle library selection - tap a selected row again to deselect.
     *
     * @param {object} context - The Vuex action context.
     * @param {string} id - The recipe id to select or deselect.
     */
    select({ commit, state }, id) {
      const off =
        state.selected && state.selected.id === id && !state.selected.fromDay
      commit('SET_SELECTED', off ? null : { id, fromDay: null })
    },

    /**
     * @param {object} context - The Vuex action context.
     * @param {string} day - The day under the drag, or null to clear.
     */
    setOver({ commit }, day) {
      commit('SET_OVER', day)
    },
  },
}
