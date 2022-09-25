export const state = () => ({
  entities: []
})

export const mutations = {
  add(state, entity) {
    state.entities.push({
      entity
    })
  },
  remove(state, entity) {
    state.entities.splice(state.entities.indexOf(entity), 1)
  },
}
