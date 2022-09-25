// general pathify function used to connect vuex-pathify to vue3 setup()
// https://github.com/davestewart/vuex-pathify/issues/95
import { computed } from '@nuxtjs/composition-api'
export default (context) => {
  const { $store } = context.root
  const get = path => computed(() => $store.get(path))
  const set = (path, data) => $store.set(path, data)
  const sync = (path) => {
    return computed({
      get () {
        return $store.get(path)
      },
      set (val) {
        return $store.set(path, val)
      },
    })
  }
  const call = (action, data) => $store.dispatch(action, data)
  const commit = (mutation, data) => $store.dispatch(mutation, data)

  return { get, set, sync, call, commit }
}
