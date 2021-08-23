export default {
  // TODO: add ability to pin items
  // TODO: add support for page titles
  addRecent(state, route) {
    // Filter out current route.
    const recent = [...state.recent].filter((o) => o.to !== route.path)

    // Add item.
    recent.unshift({
      to: route.path
    })

    // Return only the last 5 items.
    state.recent = recent.filter((o, index) => index < 5)
  }
}
