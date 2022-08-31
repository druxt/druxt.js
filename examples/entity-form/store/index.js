export const state = () => ({
  entity: undefined,
})

export const mutations = {
  clearEntity(state) {
    state.entity = undefined
  },

  setEntity(state, entity) {
    state.entity = entity
  }
}
