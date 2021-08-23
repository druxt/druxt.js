export default function ({ store, route }) {
  store.commit('addRecent', route)
}
