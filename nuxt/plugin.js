export default (context, inject) => {
  inject('druxtSchema', {
    import: async id => import(`./schemas/${id}.json`).then(m => m.default || m)
  })
}
