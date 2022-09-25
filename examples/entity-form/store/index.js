export const state = () => ({
  entities: {}
})

export const getters = {
  getEntities(state) {
    return state.entities
  }
}

export const mutations = {
  // increment(state) {
  //   state.entities++
  // }
}

export const actions = {
  async fetchEntities({ state }) {
    // make request
    const res = { data: {} };
    state.entities = res.data;
    return res.data;
  }
}
