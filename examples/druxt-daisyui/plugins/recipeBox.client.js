const KEY = 'druxt-daisyui-recipe-box'

export default function ({ store }) {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      store.commit('recipeBox/SET_IDS', JSON.parse(raw))
    }
  } catch (e) {
    // First visit or corrupted entry - start with an empty box.
  }

  store.subscribe((mutation) => {
    if (mutation.type.startsWith('recipeBox/')) {
      try {
        window.localStorage.setItem(
          KEY,
          JSON.stringify(store.state.recipeBox.ids)
        )
      } catch (e) {
        // Private browsing mode - the box lives for this session only.
      }
    }
  })
}
