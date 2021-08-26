export default {
  addMenuChildren(state, { children, parent }) {
    const index = state.menu.findIndex((o) => o.props.to === parent)
    state.menu[index].children = children
  },

  // TODO: add ability to pin items
  // TODO: add support for page titles
  addRecent(state, link) {
    // Filter out current route.
    const recent = [...state.recent].filter((o) => o.to !== link.to)

    // Add item.
    recent.unshift({
      text: link.text,
      to: link.to,
    })

    // Return only the last 5 items.
    state.recent = recent.filter((o, index) => index < 5)
  }
}
