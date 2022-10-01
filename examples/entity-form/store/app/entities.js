export const state = () => ({
  active: null
  // entities: []
})

export const mutations = {
  clear(state) {
    state.active = undefined
  },

  set(state, entity) {
    state.active = entity
  }

  // add(state, entity) {
  //   state.entities.push({
  //     entity
  //   })
  // },
  // remove(state, entity) {
  //   state.entities.splice(state.entities.indexOf(entity), 1)
  // },
}
