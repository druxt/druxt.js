export const state = () => ({
  ids: [],
})

export const mutations = {
  ADD(state, id) {
    if (!state.ids.includes(id)) {
      state.ids = [...state.ids, id]
    }
  },
  REMOVE(state, id) {
    state.ids = state.ids.filter((saved) => saved !== id)
  },
  SET_IDS(state, ids) {
    state.ids = ids.filter((id) => typeof id === 'string')
  },
}

export const getters = {
  count: ({ ids }) => ids.length,
  has: ({ ids }) => (id) => ids.includes(id),
}
