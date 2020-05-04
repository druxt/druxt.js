export default (context, inject) => {
  inject('druxtSchema', {
    import: async id => import(`~/.nuxt/schemas/${id}.json`).then(m => m.default || m)
  })
}
